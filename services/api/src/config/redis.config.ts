import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url: process.env.REDIS_URL,
  maxRetriesPerRequest: Number(process.env.REDIS_MAX_RETRIES ?? 3),
  connectTimeoutMs: Number(process.env.REDIS_CONNECT_TIMEOUT_MS ?? 10_000),
}));
