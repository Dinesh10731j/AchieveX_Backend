import { Worker } from 'bullmq';
import { QueueNames } from '../../config/bullmq';
import { redisClient } from '../../config/redis';
import { logger } from '../../common/utils/logger';
import { DeadlineJobPayload } from '../jobs';
import { ManifestationService } from '../../modules/manifestation/manifestation.service';

export const startDeadlineWorker = (manifestationService: ManifestationService): Worker<DeadlineJobPayload> => {
  const worker = new Worker<DeadlineJobPayload>(
    QueueNames.DEADLINE,
    async (job) => {
      const lockKey = `job-lock:${job.queueName}:${job.id ?? job.name}`;
      const lock = await redisClient.set(lockKey, '1', 'EX', 120, 'NX');

      if (!lock) {
        logger.warn('Skipping duplicate deadline job execution', {
          jobId: job.id,
          queue: job.queueName
        });
        return;
      }

      try {
        const status = await manifestationService.finalizeByDeadline(job.data.manifestationId);
        logger.info('Deadline job processed', {
          jobId: job.id,
          manifestationId: job.data.manifestationId,
          status
        });
      } finally {
        await redisClient.del(lockKey);
      }
    },
    {
      connection: redisClient.duplicate(),
      concurrency: 10
    }
  );

  worker.on('failed', (job, error) => {
    logger.error('Deadline job failed', {
      jobId: job?.id,
      manifestationId: job?.data.manifestationId,
      error: error.message
    });
  });

  return worker;
};
