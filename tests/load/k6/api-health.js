import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = __ENV.API_URL || 'http://localhost:4000';

export default function () {
  const res = http.get(`${BASE}/api/v1/health`);
  check(res, { 'health ok': (r) => r.status === 200 });
  sleep(0.5);
}
