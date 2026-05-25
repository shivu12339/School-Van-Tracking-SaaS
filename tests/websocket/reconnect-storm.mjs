/**
 * Simulates many rapid connect/disconnect cycles (reconnect storm).
 * CONCURRENCY=20 API_URL=... AUTH_TOKEN=... TRIP_ID=... node reconnect-storm.mjs
 */
import { io } from 'socket.io-client';

const base = process.env.API_URL ?? 'http://localhost:4000';
const token = process.env.AUTH_TOKEN;
const tripId = process.env.TRIP_ID;
const concurrency = Number(process.env.CONCURRENCY || 10);

if (!token || !tripId) {
  console.error('Set AUTH_TOKEN and TRIP_ID');
  process.exit(1);
}

let ok = 0;
let fail = 0;

async function oneCycle(i) {
  return new Promise((resolve) => {
    const socket = io(`${base}/tracking`, {
      transports: ['websocket'],
      auth: { token, tripId },
      reconnection: false,
      timeout: 8000,
    });
    socket.on('connect', () => {
      ok += 1;
      socket.disconnect();
      resolve();
    });
    socket.on('connect_error', () => {
      fail += 1;
      resolve();
    });
    setTimeout(() => {
      socket.disconnect();
      resolve();
    }, 5000);
  });
}

const batches = [];
for (let i = 0; i < concurrency; i += 1) {
  batches.push(oneCycle(i));
}
await Promise.all(batches);
console.log(JSON.stringify({ ok, fail, concurrency }));
process.exit(fail > concurrency * 0.2 ? 1 : 0);
