import Redis from 'ioredis-mock';
import { parseRedisUrl } from '../../src/common/utils/redis-connection.util';

describe('Redis integration (mock)', () => {
  it('parses redis URL and performs ping', async () => {
    const client = new Redis(parseRedisUrl('redis://localhost:6379'));
    const pong = await client.ping();
    expect(pong).toBe('PONG');
    await client.quit();
  });

  it('supports throttle key pattern used by tracking', async () => {
    const client = new Redis();
    const key = 'tracking:throttle:trip-test';
    await client.setex(key, 3, '1');
    const exists = await client.get(key);
    expect(exists).toBe('1');
    await client.del(key);
    await client.quit();
  });
});
