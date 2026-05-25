import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import { BroadcastNotificationJob, DispatchNotificationJob, GeofenceJob } from '../interfaces/notification-job.interface';
import { NOTIFICATION_QUEUES } from '../queues/queue.constants';
import { PushDeliveryService } from '../services/push-delivery.service';
import { GeofenceAlertEngine } from '../services/geofence-alert.engine';
import { NotificationDispatcherService } from '../services/notification-dispatcher.service';
import { NotificationAnalyticsService } from '../services/notification-analytics.service';
import { NotificationType } from '@prisma/client';
import { parseRedisUrl } from '../../common/utils/redis-connection.util';
import { MetricsService } from '../../core/metrics/metrics.service';
import { NotificationQueueService } from '../services/notification-queue.service';

@Injectable()
export class NotificationWorkersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationWorkersService.name);
  private workers: Worker[] = [];
  private readonly connection: ReturnType<typeof parseRedisUrl>;

  constructor(
    configService: ConfigService,
    private readonly pushDelivery: PushDeliveryService,
    private readonly geofenceEngine: GeofenceAlertEngine,
    private readonly dispatcher: NotificationDispatcherService,
    private readonly analyticsService: NotificationAnalyticsService,
    private readonly queueService: NotificationQueueService,
    private readonly metrics: MetricsService,
  ) {
    this.connection = parseRedisUrl(configService.getOrThrow<string>('redis.url'));
  }

  onModuleInit(): void {
    const pushWorker = new Worker<DispatchNotificationJob>(
      NOTIFICATION_QUEUES.PUSH,
      async (job) => this.pushDelivery.deliver(job.data.notificationId),
      { connection: this.connection, concurrency: 10 },
    );
    const geofenceWorker = new Worker<GeofenceJob>(
      NOTIFICATION_QUEUES.GEOFENCE,
      async (job) => this.geofenceEngine.evaluate(job.data),
      { connection: this.connection, concurrency: 20 },
    );
    const retryWorker = new Worker<DispatchNotificationJob>(
      NOTIFICATION_QUEUES.RETRY,
      async (job) => this.pushDelivery.deliver(job.data.notificationId),
      { connection: this.connection, concurrency: 5 },
    );
    const broadcastWorker = new Worker<BroadcastNotificationJob>(
      NOTIFICATION_QUEUES.DELAYED,
      async (job) => this.processBroadcast(job.data),
      { connection: this.connection, concurrency: 2 },
    );
    const analyticsWorker = new Worker<Record<string, unknown>>(
      NOTIFICATION_QUEUES.ANALYTICS,
      async (job) => this.processAnalytics(job.data),
      { connection: this.connection, concurrency: 5 },
    );

    this.workers = [pushWorker, geofenceWorker, retryWorker, broadcastWorker, analyticsWorker];
    this.workers.forEach((worker) => {
      worker.on('failed', (job, err) => {
        void (async () => {
          this.logger.error(`Queue job failed ${job?.name}`, err);
          this.metrics.trackQueueFailure(worker.name);
          if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
            await this.queueService.moveToDlq({
              queue: worker.name,
              jobId: job.id,
              data: job.data,
              reason: err.message,
            });
          }
        })();
      });
    });
    this.logger.log('Notification BullMQ workers started');
  }

  private async processAnalytics(data: Record<string, unknown>): Promise<void> {
    const notificationId = String(data.notificationId ?? '');
    if (!notificationId) return;
    const successCount = Number(data.successCount ?? 0);
    if (successCount > 0) {
      await this.analyticsService.trackDelivered(notificationId);
    }
  }

  private async processBroadcast(job: BroadcastNotificationJob): Promise<void> {
    const userIds = job.userIds ?? [];
    for (const userId of userIds) {
      await this.dispatcher.dispatch({
        schoolId: job.schoolId,
        userId,
        type: job.type ?? NotificationType.SCHOOL_ANNOUNCEMENT,
        title: job.title,
        body: job.body,
        deepLink: job.deepLink,
        locale: job.locale,
        dedupScope: `broadcast:${job.title}:${userId}`,
        dedupCooldownSeconds: 60,
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
  }
}
