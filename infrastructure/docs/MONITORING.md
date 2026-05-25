# Monitoring, Logging & Sentry

## Structured logging (Winston)

- JSON logs in production (`logger.util.ts`).
- Correlation ID: `X-Request-Id` header via middleware.
- Request logging interceptor records method, path, duration, status.

## Sentry

### Backend

1. `pnpm add @sentry/node` in `services/api`.
2. Set `SENTRY_DSN` + `SENTRY_ENVIRONMENT`.
3. `initSentry()` runs at bootstrap (`config/sentry.config.ts`).

### Frontend (Next.js)

```bash
pnpm add @sentry/nextjs --filter @schoolvan/web
```

Configure `sentry.client.config.ts` / `sentry.server.config.ts`.

### Flutter

Add `sentry_flutter` to driver/parent apps with DSN per flavor.

## Error tracking architecture

| Layer | Tool |
|-------|------|
| API exceptions | Sentry + GlobalExceptionFilter |
| Web UI | Sentry Next.js |
| Mobile | Sentry Flutter |
| Socket errors | Logger + optional Sentry breadcrumb |

## Socket monitoring

- Track connection count via Railway metrics.
- Alert on Redis adapter disconnects (log line from `RedisIoAdapter`).

## Uptime

- Free: [UptimeRobot](https://uptimerobot.com) → ping `/api/v1/health` every 5 min.
- Prevents Railway sleep on hobby tier.

## Log retention

- Railway log drain → optional Datadog/Logtail later.
- AWS path: CloudWatch Logs via ECS task definition.
