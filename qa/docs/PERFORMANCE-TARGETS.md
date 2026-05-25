# Performance Targets (SLOs)

## API (REST)

| Endpoint class | p50 | p95 | p99 |
|----------------|-----|-----|-----|
| Auth login | <150ms | <400ms | <800ms |
| CRUD read | <80ms | <250ms | <500ms |
| Reports | <300ms | <1.2s | <2s |
| Health | <20ms | <50ms | <100ms |

## WebSocket

| Metric | Target |
|--------|--------|
| Connect (auth handshake) | <500ms p95 |
| Location fan-out latency | <300ms p95 (Redis adapter) |
| Reconnect after drop | <3s client-side |

## Notifications

| Metric | Target |
|--------|--------|
| Geofence queue → push dispatched | <10s p95 |
| FCM delivery (provider) | <5s p95 |

## Database

| Metric | Target |
|--------|--------|
| Simple indexed query | <50ms p95 |
| PostGIS proximity query | <120ms p95 |
| Tracking batch flush | 5s interval, <200 rows/batch |

## GPS throughput

| Scale | Target |
|-------|--------|
| Per active trip | 1 update / 3–4s |
| Platform MVP | 500 concurrent trips (~150 GPS writes/s aggregated) |

## Load test pass criteria

- `api-health.js`: p95 <500ms, error rate <1%
- `gps-flood.js`: p95 <800ms at 50 VUs
- Socket smoke: 100% reconnect success in staging
