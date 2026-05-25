import { parseRedisUrl } from '../../src/common/utils/redis-connection.util';

describe('parseRedisUrl', () => {
  it('parses standard redis URL', () => {
    const opts = parseRedisUrl('redis://localhost:6379');
    expect(opts.host).toBe('localhost');
    expect(opts.port).toBe(6379);
    expect(opts.tls).toBeUndefined();
  });

  it('enables TLS for Upstash rediss URL', () => {
    const opts = parseRedisUrl('rediss://default:secret@endpoint.upstash.io:6379');
    expect(opts.tls).toEqual({});
    expect(opts.password).toBe('secret');
  });
});
