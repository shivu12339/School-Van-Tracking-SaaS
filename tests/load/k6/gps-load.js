// STEP 13 entrypoint — same as gps-flood.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    gps: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: Number(__ENV.VUS || 30) },
        { duration: '2m', target: Number(__ENV.VUS || 30) },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE = __ENV.API_URL || 'http://localhost:4000';
const TOKEN = __ENV.AUTH_TOKEN || '';
const TRIP_ID = __ENV.TRIP_ID || '';

export default function () {
  if (!TOKEN || !TRIP_ID) {
    sleep(1);
    return;
  }
  const payload = JSON.stringify({
    tripId: TRIP_ID,
    latitude: 12.97 + Math.random() * 0.01,
    longitude: 77.59 + Math.random() * 0.01,
    speed: 20 + Math.random() * 10,
    heading: Math.floor(Math.random() * 360),
    timestamp: new Date().toISOString(),
    accuracy: 12,
  });
  const res = http.post(`${BASE}/api/v1/tracking/location`, payload, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  check(res, { 'gps accepted': (r) => r.status >= 200 && r.status < 300 });
  sleep(Number(__ENV.GPS_INTERVAL_SEC || 3));
}
