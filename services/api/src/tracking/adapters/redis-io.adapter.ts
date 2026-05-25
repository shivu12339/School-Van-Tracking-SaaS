import { type INestApplication, Logger } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { type ServerOptions } from 'socket.io';
import { parseRedisUrl } from '../../common/utils/redis-connection.util';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  constructor(
    _app: INestApplication,
    private readonly configService: ConfigService,
  ) {
    super(_app);
  }

  async connectToRedis(): Promise<void> {
    // If Upstash is briefly unreachable, log + fall back to the default
    // in-memory Socket.IO adapter so the API can still bind and pass the
    // Railway healthcheck. Multi-instance pub/sub is unavailable until
    // Redis recovers, but a single replica still serves all events.
    try {
      const options = parseRedisUrl(this.configService.getOrThrow<string>('redis.url'));
      const pubClient = new Redis(options);
      const subClient = pubClient.duplicate();
      await Promise.race([
        Promise.all([pubClient.ping(), subClient.ping()]),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Socket.IO Redis adapter ping timed out (10s)')),
            10_000,
          ),
        ),
      ]);
      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log('Socket.IO Redis adapter connected');
    } catch (err) {
      this.logger.warn(
        `Socket.IO Redis adapter unavailable; using in-memory adapter (${
          err instanceof Error ? err.message : String(err)
        })`,
      );
      this.adapterConstructor = null;
    }
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
