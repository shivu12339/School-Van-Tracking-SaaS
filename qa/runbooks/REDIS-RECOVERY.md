# Redis recovery runbook

## Symptoms

- Readiness `redis: error`
- Socket.IO rooms not syncing across API instances
- All BullMQ jobs failing
- Tracking live map frozen

## Diagnosis

1. Upstash console — database status, connection limit, memory.
2. `REDIS_URL` uses `rediss://` in production (TLS).
3. API logs: `Redis error` / `ECONNRESET`.

## Recovery steps

1. **Upstash failover** — if regional outage, create new DB and update `REDIS_URL` on API + Worker.
2. **Restart services** — Railway redeploy API then Worker.
3. **Clear stale adapter state** — restart all API replicas (Socket.IO adapter reconnects).
4. **Throttle clients** — temporary rate limit if reconnect storm from mobile apps.

## Data loss awareness

- Upstash free tier: persistence settings documented in [UPSTASH-REDIS.md](../docs/UPSTASH-REDIS.md)
- GPS throttle keys are ephemeral — safe to lose
- BullMQ in-flight jobs may need DLQ replay after long outage

## Validation

```bash
API_URL=https://api.yourdomain.com bash infrastructure/scripts/health-check.sh
node tests/realtime/socket-smoke.mjs
```
