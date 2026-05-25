import { TrackingCacheService } from '../../src/tracking/redis/tracking-cache.service';

describe('TrackingCacheService', () => {
  const pipeline = {
    setex: jest.fn().mockReturnThis(),
    sadd: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  const client = {
    get: jest.fn(),
    setex: jest.fn(),
    set: jest.fn(),
    pipeline: jest.fn(() => pipeline),
  };
  const redisService = { getClient: () => client };
  let cache: TrackingCacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    cache = new TrackingCacheService(redisService as never);
  });

  it('shouldThrottle returns true when key exists', async () => {
    client.get.mockResolvedValue('1');
    expect(await cache.shouldThrottle('trip-1', 3000)).toBe(true);
    expect(client.setex).not.toHaveBeenCalled();
  });

  it('shouldThrottle sets key when absent', async () => {
    client.get.mockResolvedValue(null);
    expect(await cache.shouldThrottle('trip-1', 3000)).toBe(false);
    expect(client.setex).toHaveBeenCalledWith(expect.any(String), 3, '1');
  });

  it('markGeofenceSent uses NX', async () => {
    client.set.mockResolvedValue('OK');
    expect(await cache.markGeofenceSent('t1', 's1', '1km')).toBe(true);
    client.set.mockResolvedValue(null);
    expect(await cache.markGeofenceSent('t1', 's1', '1km')).toBe(false);
  });
});
