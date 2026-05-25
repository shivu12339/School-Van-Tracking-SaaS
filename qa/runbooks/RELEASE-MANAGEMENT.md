# Release Management

## Environments

| Env | Branch | Hosts |
|-----|--------|-------|
| local | feature/* | docker-compose |
| staging | `develop` | staging-api, staging-admin |
| production | `main` | api, admin |

## Staging release

1. Merge PR to `develop`
2. CI passes (lint, test, build)
3. Auto-deploy staging (Railway + Vercel preview)
4. Run `FINAL-QA.md` on staging
5. k6 smoke: `API_URL=staging k6 run tests/load/k6/api-health.js`

## Production release

1. PR `develop` → `main`
2. CI green
3. `deploy-api.yml`: migrations then Railway
4. `deploy-web.yml`: Vercel `--prod`
5. Smoke: health + login + one live trip
6. Monitor Sentry 2h

## Feature flags

Set in Railway without redeploy:

- `FEATURE_MAINTENANCE_MODE=true` — read-only mode
- `FEATURE_GEOFENCE_ALERTS=false` — disable geofence

## Blue-green (AWS phase)

- Two ECS target groups, switch ALB weight
- Current MVP: Railway instant rollback to previous deployment

## Mobile

- Backend first, then mobile (backward compatible)
- Staged store rollout after API stable
