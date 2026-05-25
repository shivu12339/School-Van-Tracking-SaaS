import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * HTTP proxy load for Socket.IO polling handshake (validates edge accepts connections).
 * For full WS use: node tests/websocket/reconnect-storm.mjs
 */
export const options = {
  vus: Number(__ENV.VUS || 50),
  duration: '2m',
};

const BASE = __ENV.API_URL || 'http://localhost:4000';

export default function () {
  const res = http.get(
    `${BASE}/socket.io/?EIO=4&transport=polling&t=${Date.now()}`,
  );
  check(res, {
    'handshake not 404': (r) => r.status !== 404,
  });
  sleep(1);
}
