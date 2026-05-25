# Monitoring

## Sentry

| App | DSN env | Config |
|-----|---------|--------|
| API / Worker | `SENTRY_DSN` | `services/api/src/config/sentry.init.ts` |
| Admin web | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | `apps/web/sentry.*.config.ts` |
| Flutter | Firebase Crashlytics optional | add `sentry_flutter` in release builds |

Set in Railway / Vercel secret stores — never commit DSNs to git.

## Logs

- **Winston** structured logs on API (`createWinstonLogger`)
- **Request ID** — `RequestLoggingInterceptor` + nginx `X-Request-Id`
- Railway log drain → optional Datadog / Axiom forwarder

## Alerts (recommended)

| Signal | Threshold |
|--------|-----------|
| `/health/ready` degraded | > 2 min |
| Queue `failed` jobs | > 50 |
| Sentry error rate | spike vs 24h baseline |
| Upstash memory | > 80% plan |

## Queue monitoring

Readiness returns `queue_waiting` and `queue_failed` when `PROCESS_ROLE=worker`.

## Uptime

Use `smoke-test.yml` GitHub Action or external ping on:

- `https://api.yourdomain.com/api/v1/health`
- `https://admin.yourdomain.com`
