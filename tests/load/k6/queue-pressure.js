import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Exercises health/ready (includes queue metrics on worker) and metrics scrape.
 * API_URL=... k6 run queue-pressure.js
 */
export const options = {
  vus: Number(__ENV.VUS || 15),
  duration: __ENV.DURATION || '90s',
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE = __ENV.API_URL || 'http://localhost:4000';

export default function () {
  const ready = http.get(`${BASE}/api/v1/health/ready`);
  check(ready, {
    'ready ok': (r) => r.status === 200,
    'has checks': (r) => r.json('checks') !== undefined,
  });
  const metrics = http.get(`${BASE}/api/v1/metrics`);
  check(metrics, { 'metrics ok': (r) => r.status === 200 });
  sleep(2);
}
