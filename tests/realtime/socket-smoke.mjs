/**
 * Node smoke test: Socket.IO connect + reconnect simulation
 * Usage: API_URL=... AUTH_TOKEN=... TRIP_ID=... node tests/realtime/socket-smoke.mjs
 */
import { io } from 'socket.io-client';

const base = process.env.API_URL ?? 'http://localhost:4000';
const token = process.env.AUTH_TOKEN;
const tripId = process.env.TRIP_ID;

if (!token || !tripId) {
  console.error('Set AUTH_TOKEN and TRIP_ID');
  process.exit(1);
}

const socket = io(`${base}/tracking`, {
  transports: ['websocket'],
  auth: { token, tripId },
});

socket.on('connect', () => {
  console.log('connected', socket.id);
  socket.disconnect();
  setTimeout(() => {
    const retry = io(`${base}/tracking`, {
      transports: ['websocket'],
      auth: { token, tripId },
    });
    retry.on('connect', () => {
      console.log('reconnected', retry.id);
      retry.close();
      process.exit(0);
    });
    retry.on('connect_error', (e) => {
      console.error('reconnect failed', e.message);
      process.exit(1);
    });
  }, 2000);
});

socket.on('connect_error', (e) => {
  console.error('connect failed', e.message);
  process.exit(1);
});

setTimeout(() => process.exit(1), 15_000);
