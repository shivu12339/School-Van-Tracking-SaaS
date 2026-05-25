# Step 13 — Testing, QA & Production Hardening

Enterprise QA architecture for School Van Tracking SaaS.

## Structure

| Path | Purpose |
|------|---------|
| [`docs/TESTING-ARCHITECTURE.md`](docs/TESTING-ARCHITECTURE.md) | Master testing strategy |
| [`docs/PERFORMANCE-TARGETS.md`](docs/PERFORMANCE-TARGETS.md) | SLOs and latency budgets |
| [`docs/SECURITY-TESTING.md`](docs/SECURITY-TESTING.md) | OWASP + pen-test plan |
| [`docs/OBSERVABILITY.md`](docs/OBSERVABILITY.md) | Logs, metrics, alerts |
| [`checklists/`](checklists/) | Release & QA checklists |
| [`runbooks/`](runbooks/) | Incident, release, rollback |
| [`../services/api/test/`](../services/api/test/) | Jest unit + integration |
| [`../apps/web/`](../apps/web/) | Vitest + Playwright |
| [`../tests/`](../tests/) | Cross-cutting test index |
| [`../tests/load/k6/`](../tests/load/k6/) | Load & stress tests |
| [`../tests/realtime/`](../tests/realtime/) | Socket smoke scripts |
| [`../tests/websocket/`](../tests/websocket/) | Reconnect storm |
| [`../tests/gps-simulation/`](../tests/gps-simulation/) | Mock GPS streams |
| [`alerting/`](alerting/) | Prometheus alert rules (reference) |
| [`runbooks/QUEUE-RECOVERY.md`](runbooks/QUEUE-RECOVERY.md) | BullMQ / DLQ recovery |
| [`runbooks/REDIS-RECOVERY.md`](runbooks/REDIS-RECOVERY.md) | Redis / Socket adapter recovery |
| [`runbooks/WEBSOCKET-RECOVERY.md`](runbooks/WEBSOCKET-RECOVERY.md) | Socket.IO recovery |
| [`runbooks/DB-RECOVERY.md`](runbooks/DB-RECOVERY.md) | PostgreSQL recovery |

## Quick commands

```bash
# API
cd services/api && pnpm test

# Web
cd apps/web && pnpm test && pnpm test:e2e

# Flutter
cd apps/driver && flutter test
cd apps/parent && flutter test

# Load (k6)
k6 run tests/load/k6/api-health.js
```

## Production readiness gate

All items in [`checklists/PRODUCTION-READINESS.md`](checklists/PRODUCTION-READINESS.md) must pass before launch.

See also [`docs/QA.md`](../docs/QA.md) for Step 13 summary.
