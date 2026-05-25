import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TrackingLogBatchItem } from '../interfaces/tracking-payload.interface';
import { TrackingQueueService } from '../queues/tracking-queue.service';

@Injectable()
export class TrackingBatchService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrackingBatchService.name);
  private readonly queue: TrackingLogBatchItem[] = [];
  private flushTimer?: NodeJS.Timeout;
  private readonly flushIntervalMs = 5000;
  private readonly maxBatchSize = 200;
  private readonly useBullMq: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingQueue: TrackingQueueService,
    configService: ConfigService,
  ) {
    this.useBullMq = configService.get<string>('app.processRole', 'all') !== 'worker';
  }

  onModuleInit(): void {
    this.flushTimer = setInterval(() => void this.flush(), this.flushIntervalMs);
  }

  onModuleDestroy(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    void this.flush();
  }

  enqueue(item: TrackingLogBatchItem): void {
    this.queue.push(item);
    if (this.queue.length >= this.maxBatchSize) {
      void this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0, this.maxBatchSize);

    try {
      if (this.useBullMq) {
        await this.trackingQueue.enqueuePersistBatch(batch);
        return;
      }

      await this.prisma.trackingLog.createMany({
        data: batch.map((item) => ({
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
    } catch (error) {
      this.logger.error('Failed to flush tracking batch', error as Error);
      this.queue.unshift(...batch);
    }
  }
}
