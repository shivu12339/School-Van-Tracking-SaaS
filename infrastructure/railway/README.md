# Railway Deployment

## Services

| Service | Root directory | Dockerfile | `PROCESS_ROLE` |
|---------|----------------|------------|----------------|
| **schoolvan-api** | `services/api` | `Dockerfile` | `api` |
| **schoolvan-worker** | `services/api` | `Dockerfile.worker` | `worker` |

## Setup

1. Create a [Railway](https://railway.app) project.
2. Add **GitHub repo** → deploy from `main`.
3. Create two services from the same repo (API + Worker).
4. Attach **custom domain** (e.g. `api.yourdomain.com`) with automatic HTTPS.

## Environment variables (API + Worker)

Copy from `infrastructure/env/.env.production.example`.

Critical:

- `DATABASE_URL` — Supabase **pooler** URL (`?pgbouncer=true`)
- `DIRECT_DATABASE_URL` — Supabase **direct** connection (migrations)
- `REDIS_URL` — Upstash `rediss://` URL
- `CORS_ORIGINS` — `https://admin.yourdomain.com`
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — 32+ chars
- `FCM_*` — Firebase service account
- `PROCESS_ROLE` — `api` or `worker`

Railway injects `PORT` — do not hardcode.

## WebSockets

- Socket.IO runs on the **same API service** as HTTP.
- **Redis adapter** (Upstash) required for multi-instance scaling.
- Enable **WebSockets** in Railway service settings.
- Clients connect to `wss://api.yourdomain.com` namespaces `/tracking`, `/notifications`.

## Health checks

- Liveness: `GET /api/v1/health`
- Readiness: `GET /api/v1/health/ready` (DB + Redis)

## Migrations

API container runs `prisma migrate deploy` on start. For zero-downtime, run migrations in GitHub Actions before deploy (see `.github/workflows/deploy-api.yml`).

## Scaling

| Tier | Recommendation |
|------|----------------|
| MVP | 1 API + 1 Worker, Hobby plan |
| Growth | 2+ API replicas + Redis adapter (required) |
| AWS | See `infrastructure/docs/AWS-MIGRATION.md` |

## Sleep mode

Free/Hobby tiers may sleep — use health cron (UptimeRobot) ping `/api/v1/health` every 5 min if needed.
