import { Injectable } from '@nestjs/common';
import { QueueRegistryService } from '../queues/queue-registry.service';
import { PLATFORM_QUEUES } from '../queues/queue.constants';

@Injectable()
export class QueueHealthService {
  constructor(private readonly queues: QueueRegistryService) {}

  async check(): Promise<{ status: string; waiting?: number; failed?: number }> {
    try {
      const queue = this.queues.registerQueue(PLATFORM_QUEUES.DEFAULT);
      const counts = await Promise.race([
        queue.getJobCounts('waiting', 'active', 'failed', 'delayed'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('queue check timed out (3s)')), 3_000),
        ),
      ]);
      const failed = counts.failed ?? 0;
      const waiting = counts.waiting ?? 0;
      const status = failed > 500 ? 'error' : failed > 50 ? 'degraded' : 'ok';
      return { status, waiting, failed };
    } catch {
      return { status: 'error' };
    }
  }
}
