# School Van SaaS — Test Suite (Step 13)

## Structure

```
tests/
├── fixtures/           # Shared GPS + auth payloads
├── unit/               # → services/api/test/unit
├── integration/        # → services/api/test/integration
├── e2e/                # API + web + Flutter integration_test
├── websocket/          # reconnect-storm.mjs
├── load/k6/            # api-health, gps-load, gps-flood, queue-pressure, …
├── security/           # → services/api/test/security
├── gps-simulation/     # mock streams, batch generator, driver movement
├── geofence/           # SCENARIOS.md
└── queues/             # Queue test index
```

## Commands (from repo root)

```bash
# Backend
pnpm test                    # turbo → API unit
pnpm test:e2e:api            # API e2e + security
cd services/api && pnpm test:cov

# Frontend
cd apps/web && pnpm test && pnpm test:e2e

# Flutter
cd apps/driver && flutter test
cd apps/driver && flutter test integration_test
cd apps/parent && flutter test
cd apps/parent && flutter test integration_test

# Load
pnpm qa:load
k6 run tests/load/k6/gps-load.js
k6 run tests/load/k6/queue-pressure.js

# Realtime
node tests/realtime/socket-smoke.mjs
node tests/websocket/reconnect-storm.mjs
```

## Production gate

[`qa/checklists/PRODUCTION-READINESS.md`](../qa/checklists/PRODUCTION-READINESS.md)
