/**
 * Batch GPS generator for offline sync / load test data prep.
 * npx tsx tests/gps-simulation/batch-gps-generator.ts [count] [tripId]
 */
import { buildRouteFixes, DEMO_ROUTE } from './mock-gps-stream';

const count = Number(process.argv[2] || 100);
const tripId = process.argv[3] || '00000000-0000-0000-0000-000000000099';

const route = buildRouteFixes(DEMO_ROUTE);
const batch = [];
for (let i = 0; i < count; i += 1) {
  const base = route[i % route.length];
  batch.push({
    ...base,
    tripId,
    latitude: base.latitude + (i % 10) * 0.0001,
    longitude: base.longitude + (i % 10) * 0.0001,
    timestamp: new Date(Date.now() + i * 3000).toISOString(),
  });
}

console.log(JSON.stringify({ tripId, count: batch.length, points: batch }, null, 0));
