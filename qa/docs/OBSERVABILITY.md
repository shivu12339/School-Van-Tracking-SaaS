# Observability Strategy

## Logging (Winston)

- JSON structured logs in production
- Correlation ID: `X-Request-Id` on every HTTP request
- Include: `schoolId`, `userId`, `tripId` in domain logs where applicable

## Metrics

- In-process counters: `GET /api/v1/metrics` (restrict in prod network)
- AWS path: CloudWatch embedded metric format / Prometheus sidecar

Key metrics:

- `gps.ingest`
- `socket.connect`
- `notification.dispatched`
- `queue.failed.*`

## Tracing

- Sentry performance (`@sentry/node`, `@sentry/nextjs`)
- Sample rate: 10% production (`SENTRY_TRACES_SAMPLE_RATE`)

## Alerts (recommended)

| Alert | Condition |
|-------|-----------|
| API down | Health check fails 3x |
| DB degraded | readiness.database != ok |
| Redis down | readiness.redis != ok |
| Queue backlog | DLQ depth > 100 |
| Error spike | Sentry issues > 50/hour |

## Dashboards

- Railway/Vercel built-in
- Grafana (AWS phase): API latency, socket connections, queue depth, GPS rate
