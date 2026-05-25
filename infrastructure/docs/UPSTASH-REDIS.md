# Upstash Redis

## Connection

Set `REDIS_URL=rediss://default:PASSWORD@endpoint.upstash.io:6379`

The API parses TLS via `parseRedisUrl()` for:

- `ioredis` (cache, Socket.IO adapter)
- BullMQ workers

## Use cases

| Feature | TTL / pattern |
|---------|----------------|
| Live van position | 60s cache per trip |
| ETA cache | 30–120s |
| Socket.IO adapter | Pub/sub channels |
| BullMQ | Push, geofence, retry queues |
| Rate limiting | Sliding window keys |
| Notification dedup | Short TTL keys |

## Cache invalidation

- Trip end → delete `trip:{id}:*` keys (tracking service).
- School config change → version bump invalidates tenant cache.

## Persistence

Upstash is **durable** but not a source of truth — PostgreSQL remains authoritative.

## AWS migration

Replace URL with **ElastiCache** endpoint — same `REDIS_URL` env, no code change.

## Cost

Free tier: 10K commands/day. Optimize:

- Batch GPS writes (5s flush)
- Geofence debounce
- Avoid `KEYS *` scans
