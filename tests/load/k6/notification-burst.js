import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Admin notification list under load (read-heavy).
 * AUTH_TOKEN=... API_URL=... k6 run notification-burst.js
 */
export const options = {
  vus: Number(__ENV.VUS || 20),
  duration: __ENV.DURATION || '2m',
  thresholds: {
    http_req_duration: ['p(95)<600'],
    http_req_failed: ['rate<0.02'],
  },
};

const BASE = __ENV.API_URL || 'http://localhost:4000';
const TOKEN = __ENV.AUTH_TOKEN || '';

export default function () {
  if (!TOKEN) {
    sleep(1);
    return;
  }
  const headers = { Authorization: `Bearer ${TOKEN}` };
  const list = http.get(`${BASE}/api/v1/notifications?page=1&limit=20`, { headers });
  check(list, { 'list ok': (r) => r.status === 200 });
  const unread = http.get(`${BASE}/api/v1/notifications/unread-count`, { headers });
  check(unread, { 'unread ok': (r) => r.status === 200 });
  sleep(1);
}
