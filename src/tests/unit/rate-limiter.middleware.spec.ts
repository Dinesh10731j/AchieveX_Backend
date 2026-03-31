jest.mock('../../config/redis', () => ({
  redisClient: {
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn()
  },
  isRedisReady: jest.fn(() => true)
}));

import { redisClient, isRedisReady } from '../../config/redis';
import { createRateLimiter } from '../../common/middleware/rate-limiter.middleware';

const mockedRedis = redisClient as jest.Mocked<typeof redisClient>;
const mockedIsRedisReady = isRedisReady as jest.Mock;

describe('rate limiter middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsRedisReady.mockReturnValue(true);
  });

  it('allows requests under threshold', async () => {
    mockedRedis.incr.mockResolvedValue(1 as never);
    mockedRedis.expire.mockResolvedValue(1 as never);
    mockedRedis.ttl.mockResolvedValue(20 as never);

    const middleware = createRateLimiter({ keyPrefix: 'test', windowSeconds: 60, maxRequests: 2 });

    const req = { ip: '127.0.0.1', auth: undefined } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('falls back when redis is unavailable', async () => {
    mockedIsRedisReady.mockReturnValue(false);

    const middleware = createRateLimiter({ keyPrefix: 'test', windowSeconds: 60, maxRequests: 2 });
    const req = { ip: '127.0.0.1', auth: undefined } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('throws when limit exceeded', async () => {
    mockedRedis.incr.mockResolvedValue(3 as never);
    mockedRedis.ttl.mockResolvedValue(10 as never);

    const middleware = createRateLimiter({ keyPrefix: 'test', windowSeconds: 60, maxRequests: 2 });
    const req = { ip: '127.0.0.1', auth: undefined } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    await expect(middleware(req, res, next)).rejects.toThrow('Rate limit exceeded');
  });
});
