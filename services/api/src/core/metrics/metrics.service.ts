import { Injectable } from '@nestjs/common';

type CounterMap = Map<string, number>;

/** Lightweight in-process metrics — export to CloudWatch/Prometheus via sidecar in AWS phase. */
@Injectable()
export class MetricsService {
  private readonly counters: CounterMap = new Map();

  increment(name: string, value = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + value);
  }

  snapshot(): Record<string, number> {
    return Object.fromEntries(this.counters.entries());
  }

  trackGpsIngest(): void {
    this.increment('gps.ingest');
  }

  trackSocketConnect(): void {
    this.increment('socket.connect');
  }

  trackNotificationDispatched(): void {
    this.increment('notification.dispatched');
  }

  trackQueueFailure(queue: string): void {
    this.increment(`queue.failed.${queue}`);
  }
}
