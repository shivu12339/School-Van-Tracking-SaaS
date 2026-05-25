/**
 * Simulates a driver moving along a route with realistic speed/heading.
 */
import { buildRouteFixes, DEMO_ROUTE, type GpsFix } from './mock-gps-stream';

export type MovementOptions = {
  tripId: string;
  intervalMs?: number;
  speedKmh?: number;
};

export async function* driveRoute(options: MovementOptions): AsyncGenerator<GpsFix> {
  const fixes = buildRouteFixes(DEMO_ROUTE);
  for (const fix of fixes) {
    yield {
      ...fix,
      tripId: options.tripId,
      speed: options.speedKmh ?? fix.speed,
    };
    if (options.intervalMs && options.intervalMs > 0) {
      await sleep(options.intervalMs);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
