# QA & Production Hardening (Step 13)

Enterprise quality assurance for School Van Tracking SaaS.

## Test pyramid

```
        E2E (Playwright, Flutter integration)
       /        \
  Integration (Jest + Supertest, socket smoke)
 /              \
Unit (Jest, Vitest, flutter_test)
```

## Run everything

```bash
pnpm test && pnpm test:e2e:api
cd services/api && pnpm test:cov
cd apps/web && pnpm test && pnpm test:e2e
cd apps/driver && flutter test && flutter test integration_test
cd apps/parent && flutter test && flutter test integration_test
```

## Load & realtime

```bash
k6 run tests/load/k6/api-health.js
k6 run tests/load/k6/gps-load.js             # needs AUTH_TOKEN, TRIP_ID
k6 run tests/load/k6/queue-pressure.js
node tests/realtime/socket-smoke.mjs
node tests/websocket/reconnect-storm.mjs
```

## Production hardening (implemented)

| Control | Location |
|---------|----------|
| Helmet + CSP (prod) | `bootstrap.ts` |
| Body size limit 256kb | `HTTP_BODY_LIMIT` |
| JWT + RBAC + tenant guards | `auth/guards`, `tenant/` |
| WS auth + trip access | `WsAuthGuard`, `WsTenantAccessService` |
| GPS throttle (3s) | `TrackingCacheService.shouldThrottle` |
| Geofence dedup + cooldown | `GeofenceAlertEngine` |
| BullMQ DLQ | `notification-dlq` queue |
| Correlation IDs | `RequestContextMiddleware` |
| Sentry | `sentry.init.ts`, web `sentry.*.config.ts` |
| OpenTelemetry (optional) | `OTEL_ENABLED=true`, `otel.init.ts` |
| Metrics scrape | `GET /api/v1/metrics` |
| Rate limiting | NestJS `ThrottlerGuard` |
| GPS integrity | `GpsIntegrityValidator` |
| WS room isolation | `resolveJoinRooms` + `WsTenantAccessService` |

## Release gate

Before production:

1. [`qa/checklists/PRODUCTION-READINESS.md`](../qa/checklists/PRODUCTION-READINESS.md)
2. [`qa/checklists/FINAL-QA.md`](../qa/checklists/FINAL-QA.md)
3. [`qa/checklists/APP-STORE-RELEASE.md`](../qa/checklists/APP-STORE-RELEASE.md) (mobile)

## Incident response

| Runbook | Path |
|---------|------|
| Incident | `qa/runbooks/INCIDENT-RESPONSE.md` |
| Queue recovery | `qa/runbooks/QUEUE-RECOVERY.md` |
| Redis recovery | `qa/runbooks/REDIS-RECOVERY.md` |
| Rollback | `qa/runbooks/ROLLBACK.md` |

## CI

- `ci.yml` — lint, test, Docker on every PR
- `qa-gate.yml` — Flutter matrix + web unit + audit on PR
- `load-test.yml` — weekly k6 smoke

Hub: [`qa/README.md`](../qa/README.md)
