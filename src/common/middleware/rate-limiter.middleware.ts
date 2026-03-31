import { NextFunction, Request, Response } from 'express';
import { redisClient, isRedisReady } from '../../config/redis';
import { AppError } from '../errors';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  keyPrefix: string;
  windowSeconds: number;
  maxRequests: number;
}

interface MemoryRateRecord {
  count: number;
  expiresAt: number;
}

const memoryRateStore = new Map<string, MemoryRateRecord>();

const consumeMemoryRateLimit = (key: string, windowSeconds: number): { current: number; ttl: number } => {
  const now = Date.now();
  const existing = memoryRateStore.get(key);

  if (!existing || existing.expiresAt <= now) {
    const expiresAt = now + windowSeconds * 1000;
    memoryRateStore.set(key, { count: 1, expiresAt });
    return { current: 1, ttl: windowSeconds };
  }

  existing.count += 1;
  memoryRateStore.set(key, existing);

  const ttl = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));
  return { current: existing.count, ttl };
};

export const createRateLimiter = (options: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const keyIdentifier = req.auth?.userId ?? req.ip;
    const key = `rate-limit:${options.keyPrefix}:${keyIdentifier}`;

    let current = 0;
    let ttl = options.windowSeconds;

    if (isRedisReady()) {
      try {
        current = await redisClient.incr(key);
        if (current === 1) {
          await redisClient.expire(key, options.windowSeconds);
        }

        ttl = await redisClient.ttl(key);
      } catch (error) {
        logger.warn('Redis rate limiter failed. Falling back to in-memory limiter.', {
          keyPrefix: options.keyPrefix,
          error: error instanceof Error ? error.message : String(error)
        });

        const memoryResult = consumeMemoryRateLimit(key, options.windowSeconds);
        current = memoryResult.current;
        ttl = memoryResult.ttl;
      }
    } else {
      const memoryResult = consumeMemoryRateLimit(key, options.windowSeconds);
      current = memoryResult.current;
      ttl = memoryResult.ttl;
    }

    res.setHeader('X-RateLimit-Limit', String(options.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, options.maxRequests - current)));
    res.setHeader('X-RateLimit-Reset', String(ttl));

    if (current > options.maxRequests) {
      throw new AppError('Rate limit exceeded', 429);
    }

    next();
  };
};
