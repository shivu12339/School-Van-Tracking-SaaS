/**
 * Mock GPS stream generator for integration/load tooling.
 * Usage: npx tsx tests/gps-simulation/mock-gps-stream.ts
 */
export type GpsFix = {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
  accuracy?: number;
};

export function buildRouteFixes(
  points: Array<{ lat: number; lng: number }>,
): GpsFix[] {
  const fixes: GpsFix[] = [];
  let heading = 0;
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    const next = points[i + 1];
    if (next) {
      heading = (Math.atan2(next.lng - p.lng, next.lat - p.lat) * 180) / Math.PI;
    }
    fixes.push({
      latitude: p.lat,
      longitude: p.lng,
      speed: 25,
      heading,
      timestamp: new Date(Date.now() + i * 3000).toISOString(),
      accuracy: 10,
    });
  }
  return fixes;
}

export const DEMO_ROUTE = [
  { lat: 12.9716, lng: 77.5946 },
  { lat: 12.975, lng: 77.6 },
  { lat: 12.98, lng: 77.61 },
  { lat: 12.985, lng: 77.62 },
];

if (require.main === module) {
  for (const fix of buildRouteFixes(DEMO_ROUTE)) {
    console.log(JSON.stringify(fix));
  }
}
