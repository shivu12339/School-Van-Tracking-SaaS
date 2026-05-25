# Queue tests

BullMQ coverage lives in `services/api/test/`:

| Test | File |
|------|------|
| DLQ enqueue | `unit/notification-queue.service.spec.ts` |
| Geofence queue | `unit/geofence-alert.engine.spec.ts` |
| Queue health (readiness) | `health/queue-health.service.ts` + deployment health e2e |

Load: `tests/load/k6/queue-pressure.js` hits `/health/ready` and `/metrics`.

Recovery: `qa/runbooks/QUEUE-RECOVERY.md`
