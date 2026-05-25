# Testing Architecture

## Pyramid

```
        E2E (Playwright, Flutter integration_test)
       /                                        \
  Integration (Supertest, API + DB + Redis)      \
 /                                                \
Unit (Jest, Vitest, flutter_test) — largest volume
```

## Backend (`services/api`)

| Layer | Tool | Location |
|-------|------|----------|
| Unit | Jest | `test/unit/*.spec.ts` |
| Integration | Jest + Supertest | `test/integration/*.e2e-spec.ts` |
| Mocks | jest-mock-extended, ioredis-mock | `test/mocks/` |

**Coverage targets (CI):** 45% lines global, grow to 70% pre-GA.

### Domains covered

- Auth, RBAC, tenant isolation (`tenant.guard`, `permission.service`)
- ETA / geofence / dedup
- WebSocket auth (`ws-auth.guard`)
- Health readiness

### Prisma strategy

- **Unit:** mock `PrismaService` with `jest-mock-extended`
- **Integration:** real Postgres + PostGIS (CI service container)
- **E2E smoke:** migrate + optional seed

### Redis strategy

- **Unit:** `ioredis-mock` via `createRedisServiceMock()`
- **Integration:** real Redis container in CI

### Queue strategy

- Unit-test job payloads and dedup TTL
- Integration: enqueue + worker process (staging only)
- DLQ validated via `notification-dlq` queue

## Frontend (`apps/web`)

| Layer | Tool |
|-------|------|
| Unit | Vitest + RTL |
| E2E | Playwright |

Focus: route protection, role routing, forms, dashboard data states, map mount (mock Maps API in unit).

## Flutter (`apps/driver`, `apps/parent`)

| Layer | Tool |
|-------|------|
| Widget | `flutter_test` |
| Unit | `flutter_test` + **mocktail** (extend) |
| Integration | `integration_test` (device/emulator) |

Focus: auth providers, socket reconnect, GPS throttle, offline Hive queue, FCM handlers.

## Realtime

- `tests/realtime/socket-smoke.mjs` — connect/reconnect
- k6 HTTP readiness under socket load (`tests/load/k6/socket-stress.js`)
- Staging: Artillery Socket.IO plugin for 1k+ connections

## Geofence / GPS

- Unit: `geofence-alert.engine.spec.ts` distance branches
- Load: `gps-flood.js` @ 3s interval
- PostGIS: integration with seeded student `home_location` (staging)

## CI

`.github/workflows/ci.yml` — lint, test, build on every PR.  
`.github/workflows/load-test.yml` — scheduled k6 smoke on staging.
