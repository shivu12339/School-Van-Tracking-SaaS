# WebSocket / Socket.IO Strategy

## MVP (Railway)

- Socket.IO shares the **API HTTP server** (same `PORT`).
- Clients use `wss://api.yourdomain.com` with namespaces:
  - `/tracking` — van location, trip status, student events
  - `/notifications` — in-app notification stream

## Authentication

- JWT in handshake `auth.token`.
- `WsAuthGuard` validates role + trip/school scope.

## Multi-instance scaling

**Required:** `@socket.io/redis-adapter` + Upstash (already configured).

Without Redis adapter, sticky sessions would be required — not reliable on Railway autoscale.

## Sticky sessions

- **Not required** when Redis adapter is active.
- NGINX reference config in `infrastructure/nginx/nginx.conf` documents upgrade headers for AWS ALB.

## Client reconnection

- Exponential backoff (2s base) in Flutter/web clients.
- Re-subscribe to trip room on `connect`.

## Railway checklist

- [ ] WebSockets enabled on service
- [ ] `REDIS_URL` set (rediss)
- [ ] Health check does not block WS upgrade
- [ ] CORS allows admin origin

## Monitoring

- Sentry breadcrumbs on connect/disconnect
- Log correlation ID on HTTP; WS uses tripId in logs

## Vercel note

Vercel **cannot** proxy WebSockets to Railway. Clients must connect directly to API URL — correct for MVP.
