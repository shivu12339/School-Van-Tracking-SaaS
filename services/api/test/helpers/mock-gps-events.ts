import { type TrackingUpdateDto } from '../../src/tracking/dto/gps-location.dto';

/** Generates sequential GPS updates along a line for websocket / service tests */
export function* mockGpsEventStream(
  tripId: string,
  count: number,
  startLat = 12.9716,
  startLng = 77.5946,
): Generator<TrackingUpdateDto> {
  for (let i = 0; i < count; i += 1) {
    yield {
      tripId,
      latitude: startLat + i * 0.0002,
      longitude: startLng + i * 0.0002,
      speed: 25,
      heading: 90,
      timestamp: new Date(Date.now() + i * 3000).toISOString(),
      accuracy: 10,
    };
  }
}
