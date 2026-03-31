import IORedis, { RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from '../common/utils/logger';

const baseOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: () => null,
  connectTimeout: env.redisConnectTimeoutMs
};

export const redisClient = new IORedis(env.redisUrl, baseOptions);
export const redisSubscriber = new IORedis(env.redisUrl, baseOptions);

let redisReady = false;
let redisInitAttempted = false;

const isClientOpen = (client: IORedis): boolean => {
  return ['connect', 'connecting', 'ready'].includes(client.status);
};

export const initializeRedis = async (): Promise<boolean> => {
  if (redisInitAttempted) {
    return redisReady;
  }

  redisInitAttempted = true;

  if (!env.redisEnabled) {
    logger.warn('Redis disabled by configuration. Caching, queueing, and distributed rate limits are disabled.');
    redisReady = false;
    return redisReady;
  }

  try {
    if (redisClient.status !== 'ready') {
      await redisClient.connect();
    }

    if (redisSubscriber.status !== 'ready') {
      await redisSubscriber.connect();
    }

    await redisClient.ping();
    redisReady = true;
    logger.info('Redis connected successfully');
  } catch (error) {
    redisReady = false;
    logger.warn('Redis unavailable. Falling back to in-memory behavior.', {
      error: error instanceof Error ? error.message : String(error)
    });

    redisClient.disconnect(false);
    redisSubscriber.disconnect(false);
  }

  return redisReady;
};

export const isRedisReady = (): boolean => redisReady;

export const closeRedisConnections = async (): Promise<void> => {
  const closeClient = async (client: IORedis): Promise<void> => {
    if (isClientOpen(client)) {
      try {
        await client.quit();
      } catch (_error) {
        client.disconnect(false);
      }
      return;
    }

    client.disconnect(false);
  };

  await Promise.allSettled([closeClient(redisClient), closeClient(redisSubscriber)]);
};
