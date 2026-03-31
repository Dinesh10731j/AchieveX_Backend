import { JobsOptions, Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env';
import { isRedisReady, redisClient } from './redis';
import { logger } from '../common/utils/logger';

export const QueueNames = {
  REMINDER: 'goal-reminder-queue',
  DEADLINE: 'goal-deadline-queue'
} as const;

export type ReminderJobName = 'goal.reminder';
export type DeadlineJobName = 'goal.deadline-check';

interface QueueLike {
  add(name: string, data: unknown, opts?: JobsOptions): Promise<unknown>;
  close(): Promise<void>;
}

interface QueueEventsLike {
  close(): Promise<void>;
}

class NoopQueue implements QueueLike {
  constructor(private readonly queueName: string) {}

  public async add(_name: string, _data: unknown, _opts?: JobsOptions): Promise<unknown> {
    logger.warn(`Skipped enqueue for ${this.queueName}: BullMQ is disabled`);
    return null;
  }

  public async close(): Promise<void> {
    return;
  }
}

class NoopQueueEvents implements QueueEventsLike {
  public async close(): Promise<void> {
    return;
  }
}

let connection: IORedis | null = null;
let bullMqReady = false;

export let reminderQueue: QueueLike = new NoopQueue(QueueNames.REMINDER);
export let deadlineQueue: QueueLike = new NoopQueue(QueueNames.DEADLINE);
export let reminderQueueEvents: QueueEventsLike = new NoopQueueEvents();
export let deadlineQueueEvents: QueueEventsLike = new NoopQueueEvents();

export const initializeBullMQ = (): boolean => {
  if (env.nodeEnv === 'test' || !env.redisEnabled || !isRedisReady()) {
    bullMqReady = false;
    reminderQueue = new NoopQueue(QueueNames.REMINDER);
    deadlineQueue = new NoopQueue(QueueNames.DEADLINE);
    reminderQueueEvents = new NoopQueueEvents();
    deadlineQueueEvents = new NoopQueueEvents();
    logger.warn('BullMQ disabled because Redis is unavailable');
    return bullMqReady;
  }

  connection = redisClient.duplicate();

  reminderQueue = new Queue(QueueNames.REMINDER, {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: true,
      removeOnFail: false
    }
  });

  deadlineQueue = new Queue(QueueNames.DEADLINE, {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: true,
      removeOnFail: false
    }
  });

  reminderQueueEvents = new QueueEvents(QueueNames.REMINDER, { connection });
  deadlineQueueEvents = new QueueEvents(QueueNames.DEADLINE, { connection });

  bullMqReady = true;
  logger.info('BullMQ initialized');
  return bullMqReady;
};

export const isBullMQReady = (): boolean => bullMqReady;

export const closeQueueConnections = async (): Promise<void> => {
  await Promise.allSettled([
    reminderQueue.close(),
    deadlineQueue.close(),
    reminderQueueEvents.close(),
    deadlineQueueEvents.close(),
    connection?.quit() ?? Promise.resolve('')
  ]);

  bullMqReady = false;
};
