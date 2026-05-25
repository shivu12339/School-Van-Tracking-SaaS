# MVP Deployment Runbook

## Prerequisites

- GitHub repository
- Domain (optional for MVP: use Railway + Vercel default URLs)
- Accounts: Supabase, Upstash, Railway, Vercel, Firebase, Cloudinary, Google Cloud (Maps), Sentry

## Step 1 — Supabase PostgreSQL + PostGIS

1. Create project at [supabase.com](https://supabase.com).
2. SQL Editor → run `infrastructure/scripts/enable-postgis.sql`.
3. Copy **connection pooler** URL → `DATABASE_URL` (port 6543, `pgbouncer=true`).
4. Copy **direct** URL → `DIRECT_DATABASE_URL` (port 5432).
5. Run migrations:

```bash
cd services/api
export DIRECT_DATABASE_URL="postgresql://..."
pnpm prisma migrate deploy
pnpm prisma db seed
```

## Step 2 — Upstash Redis

1. Create database at [upstash.com](https://upstash.com).
2. Enable TLS → copy `REDIS_URL` (`rediss://...`).
3. Used for: Socket.IO adapter, BullMQ, tracking cache, rate limits.

## Step 3 — Railway API

1. New project → Deploy from GitHub.
2. Service: **Root** `services/api`, Dockerfile `Dockerfile` (`railway.toml` included).
3. Variables: copy `services/api/.env.production.example` into Railway → Variables.
4. Set `PROCESS_ROLE=api`.
5. Enable **WebSockets**.
6. Custom domain → `api.yourdomain.com`.

## Step 4 — Railway Worker

1. Add second service, same repo.
2. Dockerfile path: `Dockerfile.worker` (in `services/api`).
3. Set `PROCESS_ROLE=worker`, same Redis/DB/FCM secrets.
4. Health check: `/api/v1/health/ready` on worker port.

## Step 5 — Vercel Web

1. Import repo, root `apps/web` (see `apps/web/vercel.json`).
2. Env vars: copy `apps/web/.env.production.example` (replace Railway host).
3. Domain → `admin.yourdomain.com`.
4. Update API `CORS_ORIGINS`.

## Step 6 — Firebase

See [FIREBASE.md](./FIREBASE.md). Add `FCM_*` to Railway API + Worker.

## Step 7 — Verify

```bash
API_URL=https://api.yourdomain.com infrastructure/scripts/health-check.sh
```

Login to admin dashboard, open live map, confirm WebSocket connects.

## CI/CD

Push to `main` triggers:

1. `ci.yml` — tests
2. `deploy-api.yml` — migrations + Railway
3. `deploy-web.yml` — Vercel

Configure GitHub secrets per `infrastructure/github-actions/README.md`.
