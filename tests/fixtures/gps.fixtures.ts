/** Shared GPS payloads for API, k6, and simulation tests */
export const validGpsPayload = (tripId: string, overrides: Record<string, unknown> = {}) => ({
  tripId,
  latitude: 12.9716,
  longitude: 77.5946,
  speed: 25,
  heading: 90,
  timestamp: new Date().toISOString(),
  accuracy: 12,
  ...overrides,
});

export const mockLocationStream = (
  tripId: string,
  count: number,
  start = { lat: 12.9716, lng: 77.5946 },
) => {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    points.push(
      validGpsPayload(tripId, {
        latitude: start.lat + i * 0.0003,
        longitude: start.lng + i * 0.0003,
        timestamp: new Date(Date.now() + i * 3000).toISOString(),
      }),
    );
  }
  return points;
};

export const teleportGpsPayload = (tripId: string) =>
  validGpsPayload(tripId, {
    latitude: 13.5,
    longitude: 78.5,
    speed: 200,
    isMocked: true,
  });
