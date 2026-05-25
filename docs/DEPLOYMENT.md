# Deployment & CI/CD (Step 12)

Enterprise MVP deployment for School Van SaaS.

## Architecture

| Layer | Provider | Notes |
|-------|----------|-------|
| Admin web | **Vercel** | `apps/web`, Next.js 15 |
| API + WebSocket | **Railway** | Docker, `PROCESS_ROLE=api` |
| BullMQ workers | **Railway** | `Dockerfile.worker`, `PROCESS_ROLE=worker` |
| PostgreSQL + PostGIS | **Supabase** | Pooler + direct URLs |
| Redis | **Upstash** | `rediss://`, Socket.IO adapter + BullMQ |
| Push | **Firebase** | FCM service account |
| Media | **Cloudinary** | Signed uploads |
| Errors | **Sentry** | API + Web + optional Flutter |
| CI/CD | **GitHub Actions** | Lint → test → build → deploy |

Future path: [infrastructure/docs/AWS-MIGRATION.md](../infrastructure/docs/AWS-MIGRATION.md)

## Repository layout

```
infrastructure/
├── docker/          # Dockerfiles, compose stacks
├── railway/         # railway.toml templates
├── vercel/          # Vercel guide
├── github-actions/  # Secrets & workflow docs
├── nginx/           # Future ALB reverse proxy
├── scripts/         # PostGIS, migrate, health, smoke, backup
├── env/             # .env.*.example per stage
└── monitoring/      # Sentry reference
```

## Quick deploy checklist

1. **Supabase** — run `infrastructure/scripts/enable-postgis.sql`
2. **Upstash** — copy `REDIS_URL` (`rediss://`)
3. **Railway API** — root `services/api`, Dockerfile `Dockerfile`, enable WebSockets
4. **Railway Worker** — same repo root `services/api`, Dockerfile `Dockerfile.worker`
5. **Vercel** — root `apps/web`, set env from `infrastructure/env/.env.production.example`
6. **GitHub secrets** — see `infrastructure/github-actions/README.md`
7. **Smoke** — `API_URL=https://api.example.com bash infrastructure/scripts/smoke-test.sh`

## CI/CD workflows

| Workflow | Trigger | Action |
|----------|---------|--------|
| `ci.yml` | PR / push `main`, `develop` | API + Web + Flutter analyze, Docker build |
| `deploy-api.yml` | push `main` (api paths) | Migrate → Docker verify → Railway redeploy → smoke |
| `deploy-web.yml` | push `main` (web paths) | Vercel `--prod` |
| `deploy-staging.yml` | push `develop` | Staging migrate + preview deploy |
| `smoke-test.yml` | schedule / manual | Health + Socket.IO handshake |
| `flutter-release.yml` | manual | APK artifacts |

## Health endpoints

- `GET /api/v1/health` — liveness (uptime, role)
- `GET /api/v1/health/ready` — database, redis, queue metrics (worker)

Railway health check path: `/api/v1/health/ready`

## Process roles

| Role | Deploy to |
|------|-----------|
| `api` | Railway API service |
| `worker` | Railway Worker service |
| `all` | Local development only |

## Rollback

1. **Vercel** — Promote previous deployment in dashboard
2. **Railway** — Redeploy prior successful deployment
3. **Database** — Do not roll back migrations without a down script; restore from Supabase backup if needed

## Local production-like stack

```bash
docker compose -f infrastructure/docker/docker-compose.prod.yml --env-file .env up --build
```

## Deep guides

- [MVP runbook](../infrastructure/docs/MVP-DEPLOYMENT.md)
- [Supabase](../infrastructure/docs/SUPABASE.md)
- [Upstash](../infrastructure/docs/UPSTASH-REDIS.md)
- [WebSockets](../infrastructure/docs/WEBSOCKETS.md)
- [Monitoring](../infrastructure/docs/MONITORING.md)
- [Backup](../infrastructure/docs/BACKUP-DR.md)
