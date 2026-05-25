import ws from 'k6/ws';
import { check } from 'k6';

/**
 * WebSocket reconnect storm — requires k6 v0.47+ with experimental websockets.
 * AUTH_TOKEN=... TRIP_ID=... API_URL=wss://api.example.com k6 run reconnect-storm.js
 *
 * Fallback: node tests/websocket/reconnect-storm.mjs
 */
export const options = {
  vus: Number(__ENV.VUS || 10),
  duration: '1m',
};

const WS_URL = __ENV.WS_URL || 'ws://localhost:4000';
const TOKEN = __ENV.AUTH_TOKEN || '';
const TRIP_ID = __ENV.TRIP_ID || '';

export default function () {
  if (!TOKEN || !TRIP_ID) return;

  const url = `${WS_URL.replace(/\/$/, '')}/socket.io/?EIO=4&transport=websocket`;
  const res = ws.connect(url, {}, (socket) => {
    socket.on('open', () => {
      socket.send(
        JSON.stringify({
          type: 'connect',
          data: { token: TOKEN, tripId: TRIP_ID },
        }),
      );
      socket.setTimeout(() => socket.close(), 2000);
    });
    socket.on('close', () => {});
  });

  check(res, { 'ws status 101': (r) => r && r.status === 101 });
}
