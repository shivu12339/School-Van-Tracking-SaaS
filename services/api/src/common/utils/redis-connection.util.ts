import type { RedisOptions } from 'ioredis';

/**
 * Redis options for ioredis / BullMQ / Socket.IO adapter.
 * Uses the full URL so Upstash `rediss://` TLS is applied correctly.
 */
export function parseRedisUrl(redisUrl: string): RedisOptions {
  const parsed = new URL(redisUrl);
  const options: RedisOptions = {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: parsed.username || undefined,
    password: decodedPassword(parsed.password),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10_000,
    retryStrategy: (times) => Math.min(times * 200, 3000),
  };
  if (parsed.protocol === 'rediss:') {
    options.tls = {};
  }
  return options;
}

function decodedPassword(password: string): string | undefined {
  if (!password) return undefined;
  try {
    return decodeURIComponent(password);
  } catch {
    return password;
  }
}
