import { MetricsService } from '../../src/core/metrics/metrics.service';

describe('MetricsService', () => {
  it('increments and snapshots counters', () => {
    const m = new MetricsService();
    m.trackGpsIngest();
    m.trackGpsIngest();
    m.trackSocketConnect();
    m.trackQueueFailure('push-notifications');
    const snap = m.snapshot();
    expect(snap['gps.ingest']).toBe(2);
    expect(snap['socket.connect']).toBe(1);
    expect(snap['queue.failed.push-notifications']).toBe(1);
  });
});
