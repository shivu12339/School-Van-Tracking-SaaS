# WebSocket recovery runbook

## Symptoms

- Parents/drivers show "offline" but API healthy
- Live map frozen
- Socket connect errors in mobile logs
- Spike in `socket.connect` metrics without matching GPS

## Diagnosis

1. Confirm Redis adapter: all API replicas must share `REDIS_URL`
2. Railway: WebSockets enabled on API service
3. `node tests/realtime/socket-smoke.mjs` with valid `AUTH_TOKEN` + `TRIP_ID`
4. CORS / WSS: clients use `wss://` matching API domain

## Recovery

1. Rolling restart all API instances (Railway redeploy)
2. If Redis down → [REDIS-RECOVERY.md](./REDIS-RECOVERY.md)
3. Clear stale `tracking:active:*` keys only after confirming no active trips (ops approval)

## Reconnect storm

- Mobile apps backoff reconnect (driver/parent socket managers)
- Temporarily scale API if >500 concurrent connections
- Run `node tests/websocket/reconnect-storm.mjs` on staging after fix

## Prevention

- Staging test with 2 API replicas + Redis adapter before prod scale-out
