import { closeQueueConnections, initializeBullMQ, isBullMQReady } from '../../config/bullmq';
import { AppDataSource } from '../../config/database';
import { closeRedisConnections, initializeRedis } from '../../config/redis';
import { logger } from '../../common/utils/logger';
import { formatErrorForLog } from '../../common/utils/error-formatter';
import { buildContainer } from '../../container';
import { startWorkers, stopWorkers } from './index';

const bootstrapWorker = async (): Promise<void> => {
  await AppDataSource.initialize();
  logger.info('Worker DB initialized');

  await initializeRedis();
  initializeBullMQ();

  if (!isBullMQReady()) {
    logger.warn('Worker process is shutting down because BullMQ is disabled (Redis unavailable).');
    await Promise.allSettled([closeQueueConnections(), closeRedisConnections(), AppDataSource.destroy()]);
    process.exit(0);
  }

  const container = buildContainer();
  const workers = startWorkers(
    container.services.manifestationService,
    container.services.notificationService
  );

  const shutdown = async (): Promise<void> => {
    logger.info('Worker shutdown initiated');
    await stopWorkers(workers);
    await Promise.allSettled([
      closeQueueConnections(),
      closeRedisConnections(),
      AppDataSource.destroy()
    ]);
    logger.info('Worker shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

bootstrapWorker().catch(async (error) => {
  logger.error('Worker bootstrap failed', formatErrorForLog(error));
  await Promise.allSettled([closeQueueConnections(), closeRedisConnections()]);
  process.exit(1);
});
