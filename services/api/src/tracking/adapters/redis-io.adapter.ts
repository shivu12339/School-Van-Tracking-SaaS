import { type INestApplication, Logger } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { type ServerOptions } from 'socket.io';
import { parseRedisUrl } from '../../common/utils/redis-connection.util';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor!: ReturnType<typeof createAdapter>;

  constructor(
    _app: INestApplication,
    private readonly configService: ConfigService,
  ) {
    super(_app);
  }

  async connectToRedis(): Promise<void> {
    const options = parseRedisUrl(this.configService.getOrThrow<string>('redis.url'));
    const pubClient = new Redis(options);
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.ping(), subClient.ping()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
    this.logger.log('Socket.IO Redis adapter connected');
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
