# Production Readiness Checklist

## Infrastructure

- [ ] Supabase PostGIS enabled
- [ ] Migrations applied on production
- [ ] Upstash Redis TLS configured
- [ ] Railway API + Worker deployed
- [ ] Vercel admin deployed
- [ ] Custom domains + HTTPS
- [ ] CORS restricted to admin domain
- [ ] Secrets in platform vault (not git)

## API hardening

- [ ] `NODE_ENV=production`
- [ ] JWT secrets ≥32 chars rotated from dev
- [ ] Throttling enabled
- [ ] Helmet headers active
- [ ] `PROCESS_ROLE` split api/worker
- [ ] DLQ queue monitored
- [ ] Readiness probe wired to Railway

## Data

- [ ] Backup strategy documented and tested
- [ ] Indexes validated (`EXPLAIN` on geo queries)
- [ ] Connection pooler in use

## Realtime

- [ ] Redis Socket.IO adapter verified with 2 API replicas (staging)
- [ ] Socket smoke test passed
- [ ] GPS flood load test passed

## Mobile

- [ ] Firebase prod project configured
- [ ] Maps API keys restricted
- [ ] See [MOBILE-RELEASE.md](./MOBILE-RELEASE.md)

## QA sign-off

- [ ] [FINAL-QA.md](./FINAL-QA.md) completed
- [ ] [PRODUCTION-HARDENING.md](./PRODUCTION-HARDENING.md) completed
- [ ] Security checklist completed
- [ ] Staging soak test 24h

## Observability

- [ ] Sentry DSN production
- [ ] Uptime monitoring on `/api/v1/health`
- [ ] On-call runbook shared

**Sign-off:** _______________  **Date:** _______________
