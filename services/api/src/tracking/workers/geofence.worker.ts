/**
 * Geofence processing runs inline after each throttled GPS update (GeofenceService).
 * For very high load, move evaluateTripProximity to a dedicated queue consumer
 * (BullMQ / SQS) subscribed to `tracking:geofence` Redis channel.
 */
export const GEOFENCE_WORKER_NOTE =
  'Inline geofence evaluation enabled; extract to queue when >5k concurrent trips.';
