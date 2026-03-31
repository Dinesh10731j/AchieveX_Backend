import chalk from 'chalk';
import http from 'http';
import { createApp } from './app';
import { buildContainer } from './container';
import { closeQueueConnections, initializeBullMQ } from './config/bullmq';
import { AppDataSource } from './config/database';
import { env } from './config/env';
import { closeRedisConnections, initializeRedis } from './config/redis';
import { verifySmtpConnection } from './config/smtp';
import { formatErrorForLog } from './common/utils/error-formatter';
import { logger } from './common/utils/logger';
import { initSocketServer } from './sockets';

const bootstrap = async (): Promise<void> => {
  await AppDataSource.initialize();
  logger.info('Database initialized');

  if (env.autoRunMigrations) {
    const executedMigrations = await AppDataSource.runMigrations();

    if (executedMigrations.length === 0) {
      logger.info(chalk.yellow('No pending migrations found'));
    } else {
      for (const migration of executedMigrations) {
        logger.info(chalk.green(`Migration applied: ${migration.name}`));
      }
      logger.info(chalk.cyan(`Total migrations applied: ${executedMigrations.length}`));
    }
  }

  await initializeRedis();
  initializeBullMQ();
  await verifySmtpConnection();

  const container = buildContainer();
  const app = createApp(container);

  const server = http.createServer(app);
  initSocketServer(server);

  server.listen(env.port, () => {
    logger.info(`AchieveX API running on port ${env.port}`);
  });

  const shutdown = async (): Promise<void> => {
    logger.info('Graceful shutdown started');

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    await Promise.allSettled([
      closeQueueConnections(),
      closeRedisConnections(),
      AppDataSource.destroy()
    ]);

    logger.info('Graceful shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

bootstrap().catch(async (error) => {
  logger.error('Failed to bootstrap server', formatErrorForLog(error));
  await Promise.allSettled([closeQueueConnections(), closeRedisConnections()]);
  process.exit(1);
});
