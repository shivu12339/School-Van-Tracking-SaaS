import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import {
  BroadcastNotificationJob,
  DispatchNotificationJob,
  GeofenceJob,
} from '../interfaces/notification-job.interface';
import { parseRedisUrl } from '../../common/utils/redis-connection.util';
import {
  NOTIFICATION_QUEUES,
  QUEUE_DEFAULT_OPTIONS,
  QUEUE_DLQ_OPTIONS,
} from '../queues/queue.constants';

@Injectable()
export class NotificationQueueService implements OnModuleDestroy {
  private readonly connection: ReturnType<typeof parseRedisUrl>;
  readonly pushQueue: Queue<DispatchNotificationJob>;
  readonly geofenceQueue: Queue<GeofenceJob>;
  readonly delayedQueue: Queue<DispatchNotificationJob | BroadcastNotificationJob>;
  readonly retryQueue: Queue<DispatchNotificationJob>;
  readonly analyticsQueue: Queue<Record<string, unknown>>;
  readonly dlqQueue: Queue<Record<string, unknown>>;

  constructor(configService: ConfigService) {
    this.connection = parseRedisUrl(configService.getOrThrow<string>('redis.url'));
    const base = { connection: this.connection };

    this.pushQueue = new Queue(NOTIFICATION_QUEUES.PUSH, base);
    this.geofenceQueue = new Queue(NOTIFICATION_QUEUES.GEOFENCE, base);
    this.delayedQueue = new Queue(NOTIFICATION_QUEUES.DELAYED, base);
    this.retryQueue = new Queue(NOTIFICATION_QUEUES.RETRY, base);
    this.analyticsQueue = new Queue(NOTIFICATION_QUEUES.ANALYTICS, base);
    this.dlqQueue = new Queue(NOTIFICATION_QUEUES.DLQ, base);
  }

  async moveToDlq(payload: Record<string, unknown>): Promise<void> {
    await this.dlqQueue.add('failed', payload, QUEUE_DLQ_OPTIONS);
  }

  async enqueuePush(job: DispatchNotificationJob, delayMs = 0): Promise<void> {
    await this.pushQueue.add('dispatch', job, {
      ...QUEUE_DEFAULT_OPTIONS,
      delay: delayMs,
    });
  }

  async enqueueGeofence(job: GeofenceJob): Promise<void> {
    await this.geofenceQueue.add('evaluate', job, {
      ...QUEUE_DEFAULT_OPTIONS,
      attempts: 3,
    });
  }

  async enqueueRetry(job: DispatchNotificationJob, delayMs: number): Promise<void> {
    await this.retryQueue.add('retry', job, {
      ...QUEUE_DEFAULT_OPTIONS,
      delay: delayMs,
    });
  }

  async enqueueBroadcast(job: BroadcastNotificationJob): Promise<void> {
    await this.delayedQueue.add('broadcast', job, QUEUE_DEFAULT_OPTIONS);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([
      this.pushQueue.close(),
      this.geofenceQueue.close(),
      this.delayedQueue.close(),
      this.retryQueue.close(),
      this.analyticsQueue.close(),
      this.dlqQueue.close(),
    ]);
  }
}
