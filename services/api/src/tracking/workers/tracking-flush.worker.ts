/**
 * Tracking log persistence is handled by TrackingBatchService (5s interval flush).
 * This worker placeholder documents the production evolution path for dedicated flush nodes.
 */
export const TRACKING_FLUSH_WORKER_NOTE =
  'Batch flush active via TrackingBatchService.onModuleInit interval.';
