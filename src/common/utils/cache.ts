import { redisClient, isRedisReady } from '../../config/redis';

interface MemoryCacheValue {
  value: unknown;
  expiresAt: number;
}

const memoryCache = new Map<string, MemoryCacheValue>();

const getMemory = <T>(key: string): T | null => {
  const item = memoryCache.get(key);
  if (!item) {
    return null;
  }

  if (item.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return item.value as T;
};

export const cacheGetJson = async <T>(key: string): Promise<T | null> => {
  if (!isRedisReady()) {
    return getMemory<T>(key);
  }

  try {
    const value = await redisClient.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch (_error) {
    return getMemory<T>(key);
  }
};

export const cacheSetJson = async (key: string, value: unknown, ttlSeconds: number): Promise<void> => {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });

  if (!isRedisReady()) {
    return;
  }

  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (_error) {
    return;
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  memoryCache.delete(key);

  if (!isRedisReady()) {
    return;
  }

  try {
    await redisClient.del(key);
  } catch (_error) {
    return;
  }
};
