import { Worker } from 'bullmq';
import { NotificationService } from '../../modules/notification/notification.service';
import { ManifestationService } from '../../modules/manifestation/manifestation.service';
import { startDeadlineWorker } from './deadline.worker';
import { startReminderWorker } from './reminder.worker';
import { isBullMQReady } from '../../config/bullmq';

export interface WorkerGroup {
  reminderWorker: Worker;
  deadlineWorker: Worker;
}

export const startWorkers = (
  manifestationService: ManifestationService,
  notificationService: NotificationService
): WorkerGroup | null => {
  if (!isBullMQReady()) {
    return null;
  }

  const reminderWorker = startReminderWorker(notificationService);
  const deadlineWorker = startDeadlineWorker(manifestationService);

  return {
    reminderWorker,
    deadlineWorker
  };
};

export const stopWorkers = async (workers: WorkerGroup | null): Promise<void> => {
  if (!workers) {
    return;
  }

  await Promise.allSettled([workers.reminderWorker.close(), workers.deadlineWorker.close()]);
};
