# GitHub Actions

Workflows: [`.github/workflows/`](../../.github/workflows/)

## Pipeline flow

```
Push / PR
  → ci.yml (lint, test, typecheck, Docker build)
  → deploy-validation.yml (env templates, Docker, Next prod build)
Push main (api)
  → deploy-api.yml (prisma migrate → Railway API + Worker → smoke)
Push main (web)
  → deploy-web.yml (Vercel production)
Push develop
  → deploy-staging.yml (staging migrate → preview)
```

## Required secrets

### Production

| Secret | Used by |
|--------|---------|
| `DIRECT_DATABASE_URL` | Prisma migrate (Supabase direct, port 5432) |
| `RAILWAY_TOKEN` | Railway GraphQL redeploy |
| `RAILWAY_API_SERVICE_ID` | API service |
| `RAILWAY_WORKER_SERVICE_ID` | Worker service |
| `PRODUCTION_API_URL` | Smoke tests (`https://api...`) |
| `VERCEL_TOKEN` | Vercel deploy |
| `VERCEL_ORG_ID` | Vercel deploy |
| `VERCEL_PROJECT_ID` | Vercel deploy |

### Staging

| Secret | Used by |
|--------|---------|
| `STAGING_DIRECT_DATABASE_URL` | Staging migrations |
| `STAGING_API_URL` | Staging smoke |
| `RAILWAY_STAGING_API_SERVICE_ID` | Optional staging API |

### Flutter release (manual workflow)

| Secret | Purpose |
|--------|---------|
| `GOOGLE_MAPS_KEY` | `--dart-define` for release APK |

### Optional

| Secret | Purpose |
|--------|---------|
| `SENTRY_AUTH_TOKEN` | Source map uploads |
| `DATABASE_URL` | Prisma migrate job (pooler URL; optional if only DIRECT is set) |

## GitHub Environments

Create **production** and **staging** environments with required reviewers for production deploys.

## Railway GitHub integration (alternative)

Instead of `RAILWAY_TOKEN`, connect the repo in Railway dashboard — deploys trigger on push automatically. Keep `deploy-api.yml` migrate job for Prisma.

## Rollback

1. Re-run successful workflow from Actions tab, or
2. Railway → Deployments → Rollback, or
3. Vercel → Deployments → Promote previous
