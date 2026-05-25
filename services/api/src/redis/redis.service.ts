import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { parseRedisUrl } from '../common/utils/redis-connection.util';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.getOrThrow<string>('redis.url');
    const maxRetries = this.configService.get<number>('redis.maxRetriesPerRequest', 3);
    const connectTimeout = this.configService.get<number>('redis.connectTimeoutMs', 10_000);

    this.client = new Redis({
      ...parseRedisUrl(url),
      maxRetriesPerRequest: maxRetries,
      connectTimeout,
      retryStrategy: (times) => Math.min(times * 200, 3000),
      reconnectOnError: (err) => {
        const message = err.message ?? '';
        return message.includes('READONLY') || message.includes('ECONNRESET');
      },
    });

    this.client.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
    this.client.on('connect', () => this.logger.log('Redis connected'));
  }

  async onModuleInit(): Promise<void> {
    await this.ping();
  }

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async isHealthy(): Promise<boolean> {
    try {
      return (await this.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
