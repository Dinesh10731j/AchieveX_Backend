import { Job, Worker } from 'bullmq';
import { QueueNames } from '../../config/bullmq';
import { redisClient } from '../../config/redis';
import { logger } from '../../common/utils/logger';
import { ManifestationStatus, NotificationType } from '../../database/entities';
import { ManifestationRepository } from '../../database/repositories';
import { ReminderJobPayload } from '../jobs';
import { NotificationService } from '../../modules/notification/notification.service';

const withIdempotencyLock = async (job: Job, handler: () => Promise<void>): Promise<void> => {
  const lockKey = `job-lock:${job.queueName}:${job.id ?? job.name}`;
  const lock = await redisClient.set(lockKey, '1', 'EX', 60, 'NX');

  if (!lock) {
    logger.warn('Skipping duplicate reminder job execution', { jobId: job.id, queue: job.queueName });
    return;
  }

  try {
    await handler();
  } finally {
    await redisClient.del(lockKey);
  }
};

export const startReminderWorker = (notificationService: NotificationService): Worker<ReminderJobPayload> => {
  const manifestationRepository = new ManifestationRepository();

  const worker = new Worker<ReminderJobPayload>(
    QueueNames.REMINDER,
    async (job) =>
      withIdempotencyLock(job, async () => {
        const manifestation = await manifestationRepository.findById(job.data.manifestationId);

        if (!manifestation || manifestation.status !== ManifestationStatus.PENDING) {
          return;
        }

        if (manifestation.deadline.getTime() <= Date.now()) {
          return;
        }

        const reminderLabel = job.data.reminderType === '1d' ? '1 day' : '1 hour';
        await notificationService.notify({
          userId: manifestation.userId,
          type: NotificationType.GOAL_REMINDER,
          title: 'Goal reminder',
          message: `Your goal "${manifestation.title}" reaches deadline in ${reminderLabel}.`,
          data: {
            manifestationId: manifestation.id,
            reminderType: job.data.reminderType,
            confidenceScore: manifestation.confidenceScore
          }
        });
      }),
    {
      connection: redisClient.duplicate(),
      concurrency: 20
    }
  );

  worker.on('completed', (job) => {
    logger.info('Reminder job completed', { jobId: job.id, manifestationId: job.data.manifestationId });
  });

  worker.on('failed', (job, error) => {
    logger.error('Reminder job failed', {
      jobId: job?.id,
      manifestationId: job?.data.manifestationId,
      error: error.message
    });
  });

  return worker;
};
