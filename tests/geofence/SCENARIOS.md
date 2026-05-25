# Geofence test scenarios

Automated coverage: `services/api/test/unit/geofence-alert.engine.spec.ts`

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Student 400m from van | `VAN_WITHIN_500M` only |
| 2 | Student 900m from van | `VAN_WITHIN_1KM` only |
| 3 | Cooldown active | No duplicate dispatch |
| 4 | Student already PICKED | Excluded from radius query |
| 5 | Burst GPS same cell | Geofence throttle 5s |

## Manual QA

1. Start active trip with pending students near route.
2. Drive van within 1km — parent receives 1km push.
3. Continue to 500m — 500m push (not second 1km).
4. Repeat within 24h — no duplicate (Redis cooldown).
