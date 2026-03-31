import { deadlineQueue, reminderQueue, isBullMQReady } from '../../config/bullmq';
import { logger } from '../../common/utils/logger';

export interface ReminderJobPayload {
  manifestationId: string;
  reminderType: '1d' | '1h';
}

export interface DeadlineJobPayload {
  manifestationId: string;
}

export const scheduleManifestationJobs = async (
  manifestationId: string,
  deadline: Date
): Promise<void> => {
  if (!isBullMQReady()) {
    logger.warn('BullMQ is not ready. Reminder/deadline jobs were not scheduled.', { manifestationId });
    return;
  }

  const now = Date.now();
  const deadlineMs = deadline.getTime();

  const oneDayBefore = deadlineMs - 24 * 60 * 60 * 1000;
  const oneHourBefore = deadlineMs - 60 * 60 * 1000;

  if (oneDayBefore > now) {
    await reminderQueue.add(
      'goal.reminder',
      { manifestationId, reminderType: '1d' } satisfies ReminderJobPayload,
      {
        delay: oneDayBefore - now,
        jobId: `goal:${manifestationId}:reminder:1d`
      }
    );
  }

  if (oneHourBefore > now) {
    await reminderQueue.add(
      'goal.reminder',
      { manifestationId, reminderType: '1h' } satisfies ReminderJobPayload,
      {
        delay: oneHourBefore - now,
        jobId: `goal:${manifestationId}:reminder:1h`
      }
    );
  }

  await deadlineQueue.add(
    'goal.deadline-check',
    { manifestationId } satisfies DeadlineJobPayload,
    {
      delay: Math.max(0, deadlineMs - now),
      jobId: `goal:${manifestationId}:deadline`
    }
  );
};
