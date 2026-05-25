# Production Hardening Checklist

## API

- [ ] Environment validation (Joi schema on boot)
- [ ] Global exception filter — no stack traces to clients
- [ ] Input validation on all DTOs
- [ ] SQL injection prevented (Prisma parameterized)
- [ ] File upload size limits (when enabled)
- [ ] Feature flags for kill-switch (`FEATURE_MAINTENANCE_MODE`)

## Database

- [ ] Row-level tenant filtering in services
- [ ] Soft delete middleware active
- [ ] Slow query log enabled (Supabase dashboard)
- [ ] Migration rollback plan documented

## Redis

- [ ] TTL on cache keys
- [ ] Dedup keys for notifications
- [ ] No unbounded keys (`KEYS *` banned in code)
- [ ] Failover runbook if Upstash unavailable

## Queues

- [ ] 5 retries exponential backoff
- [ ] DLQ `notification-dlq` monitored
- [ ] Worker horizontal scale tested

## WebSocket

- [ ] JWT required on handshake
- [ ] Trip/school room authorization
- [ ] Rate limit connection attempts (WAF / API gateway)

## Web

- [ ] httpOnly cookies for tokens
- [ ] CSP headers (Vercel config)
- [ ] XSS — React escaping + no `dangerouslySetInnerHTML`
- [ ] CSRF — SameSite cookies + server actions

## Mobile

- [ ] Secure storage for tokens
- [ ] Certificate pinning (prod flavor)
- [ ] Background location disclosure (store compliance)
