import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import { parseRedisUrl } from '../../common/utils/redis-connection.util';
import { MetricsService } from '../../core/metrics/metrics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TrackingAnalyticsJob, TrackingPersistJob } from '../interfaces/tracking-job.interface';
import { TRACKING_QUEUES } from '../queues/tracking-queue.constants';

@Injectable()
export class TrackingWorkersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrackingWorkersService.name);
  private workers: Worker[] = [];
  private readonly connection: ReturnType<typeof parseRedisUrl>;

  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {
    this.connection = parseRedisUrl(configService.getOrThrow<string>('redis.url'));
  }

  onModuleInit(): void {
    const persistWorker = new Worker<TrackingPersistJob>(
      TRACKING_QUEUES.PERSIST,
      async (job) => this.persistBatch(job.data),
      { connection: this.connection, concurrency: 8 },
    );

    const analyticsWorker = new Worker<TrackingAnalyticsJob>(
      TRACKING_QUEUES.ANALYTICS,
      (job) => {
        this.recordAnalytics(job.data);
        return Promise.resolve();
      },
      { connection: this.connection, concurrency: 4 },
    );

    this.workers = [persistWorker, analyticsWorker];
    this.workers.forEach((worker) => {
      worker.on('failed', (_job, err) => {
        this.logger.error(`Tracking worker ${worker.name} failed`, err);
        this.metrics.trackQueueFailure(worker.name);
      });
    });
    this.logger.log('Tracking BullMQ workers started');
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.close()));
    this.workers = [];
  }

  private async persistBatch(data: TrackingPersistJob): Promise<void> {
    if (!data.items.length) return;
    await this.prisma.trackingLog.createMany({
      data: data.items.map((item) => ({
        schoolId: item.schoolId,
        tripId: item.tripId,
        vanId: item.vanId,
        latitude: item.latitude,
        longitude: item.longitude,
        speed: item.speed,
        heading: item.heading,
        accuracy: item.accuracy,
        eventTimestamp: new Date(item.timestamp),
      })),
      skipDuplicates: true,
    });
  }

  private recordAnalytics(data: TrackingAnalyticsJob): void {
    this.metrics.increment(`tracking.${data.event}`);
    this.logger.debug(`Tracking analytics ${data.event} trip=${data.tripId}`);
  }
}
