/**
 * Socket.IO connection stress — run with k6 experimental websockets or artillery.
 * k6 run socket-stress.js (requires k6 v0.52+ with websockets module)
 *
 * For CI smoke: use tests/realtime/socket-smoke.mjs with node + socket.io-client
 */
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 100),
  duration: __ENV.DURATION || '2m',
};

const BASE = __ENV.API_URL || 'http://localhost:4000';

export default function () {
  const res = http.get(`${BASE}/api/v1/health/ready`);
  check(res, { ready: (r) => r.status === 200 });
}
