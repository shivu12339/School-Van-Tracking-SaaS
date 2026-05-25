export const TrackingRedisKeys = {
  activeTrip: (schoolId: string, tripId: string) => `school:${schoolId}:activeTrip:${tripId}`,
  vanLocation: (schoolId: string, vanId: string) => `school:${schoolId}:van:${vanId}:location`,
  tripLocation: (schoolId: string, tripId: string) => `school:${schoolId}:trip:${tripId}:location`,
  driverOnline: (schoolId: string, driverId: string) => `school:${schoolId}:driver:${driverId}:online`,
  eta: (tripId: string, studentId: string) => `eta:${tripId}:${studentId}`,
  throttle: (tripId: string) => `tracking:throttle:${tripId}`,
  geofenceDedup: (tripId: string, studentId: string, type: string) =>
    `geofence:sent:${tripId}:${studentId}:${type}`,
  activeTripsSet: (schoolId: string) => `school:${schoolId}:activeTrips`,
  driverActiveTrip: (schoolId: string, driverId: string) =>
    `school:${schoolId}:driver:${driverId}:activeTrip`,
  reconnectSnapshot: (tripId: string) => `tracking:reconnect:${tripId}`,
  lastGpsSample: (tripId: string) => `tracking:lastSample:${tripId}`,
  trackingBatch: () => 'tracking:batch:queue',
} as const;
