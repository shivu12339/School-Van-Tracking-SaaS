import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, type QueueOptions } from 'bullmq';
import { parseRedisUrl } from '../common/utils/redis-connection.util';
import { DEFAULT_QUEUE_JOB_OPTIONS, PLATFORM_QUEUES } from './queue.constants';

@Injectable()
export class QueueRegistryService implements OnModuleDestroy {
  private readonly connection: ReturnType<typeof parseRedisUrl>;
  private readonly queues = new Map<string, Queue>();

  constructor(private readonly configService: ConfigService) {
    this.connection = parseRedisUrl(this.configService.getOrThrow<string>('redis.url'));
  }

  getConnection(): ReturnType<typeof parseRedisUrl> {
    return this.connection;
  }

  registerQueue<T = unknown>(name: string, options?: Partial<QueueOptions>): Queue<T> {
    const existing = this.queues.get(name);
    if (existing) return existing as Queue<T>;

    const queue = new Queue<T>(name, {
      connection: this.connection,
      defaultJobOptions: DEFAULT_QUEUE_JOB_OPTIONS,
      ...options,
    });
    this.queues.set(name, queue as Queue);
    return queue;
  }

  getDefaultQueue<T = unknown>(): Queue<T> {
    return this.registerQueue<T>(PLATFORM_QUEUES.DEFAULT);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
    this.queues.clear();
  }
}
