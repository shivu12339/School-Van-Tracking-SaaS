import { type TrackingLogBatchItem } from './tracking-payload.interface';

export interface TrackingPersistJob {
  items: TrackingLogBatchItem[];
}

export interface TrackingAnalyticsJob {
  schoolId: string;
  tripId: string;
  event: 'location' | 'trip_start' | 'trip_stop' | 'sos';
  metadata?: Record<string, unknown>;
}
