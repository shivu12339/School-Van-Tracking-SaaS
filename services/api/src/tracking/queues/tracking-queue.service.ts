import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QueueRegistryService } from '../../queues/queue-registry.service';
import { TrackingAnalyticsJob, TrackingPersistJob } from '../interfaces/tracking-job.interface';
import { TRACKING_PERSIST_JOB, TRACKING_QUEUES } from './tracking-queue.constants';

@Injectable()
export class TrackingQueueService {
  private readonly persistQueue: Queue<TrackingPersistJob>;
  private readonly analyticsQueue: Queue<TrackingAnalyticsJob>;

  constructor(private readonly queueRegistry: QueueRegistryService) {
    this.persistQueue = this.queueRegistry.registerQueue<TrackingPersistJob>(
      TRACKING_QUEUES.PERSIST,
    );
    this.analyticsQueue = this.queueRegistry.registerQueue<TrackingAnalyticsJob>(
      TRACKING_QUEUES.ANALYTICS,
    );
  }

  async enqueuePersistBatch(items: TrackingPersistJob['items']): Promise<void> {
    if (items.length === 0) return;
    await this.persistQueue.add(
      TRACKING_PERSIST_JOB,
      { items },
      { removeOnComplete: true, attempts: 5 },
    );
  }

  async enqueueAnalytics(job: TrackingAnalyticsJob): Promise<void> {
    await this.analyticsQueue.add('track-event', job, {
      removeOnComplete: true,
      attempts: 2,
    });
  }
}
