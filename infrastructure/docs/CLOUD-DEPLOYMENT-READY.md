# Cloud deployment readiness

## Automated pipelines

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR / push | Lint, test, Docker build |
| `deploy-validation.yml` | PR / main | Env templates, Docker, Next production build |
| `deploy-api.yml` | Push `main` (api paths) | Prisma migrate → Docker verify → Railway redeploy → smoke |
| `deploy-web.yml` | Push `main` (web paths) | Vercel production |
| `smoke-test.yml` | Cron / manual | Production health + auth smoke |

## Local validation

```bash
pnpm validate:deploy
cd services/api && npm run build
cd apps/web && npm run build
```

## Railway (API)

| Setting | Value |
|---------|--------|
| **Root directory** | `` (repo root — DO NOT use `services/api`) |
| Build context | Repo root (so `packages/*` workspace packages are reachable) |
| Dockerfile | `services/api/Dockerfile` |
| Config | `railway.json` (root) or `services/api/railway.json` |
| **Dashboard Start Command** | **EMPTY** (the `railway.json` `startCommand` is used) |
| Health | `GET /api/v1/health/ready` |
| WebSockets | Enabled |
| Entrypoint | `/app/scripts/docker-entrypoint.sh` (migrate + start) |

> **GOTCHA — Start Command override.** The runtime image intentionally **does not include pnpm**. If Railway → Service → Settings → Deploy → **Start Command** contains anything (e.g. `pnpm --filter @schoolvan/api start`), the container will crash with `pnpm: not found`. **Clear the field**, then Redeploy. The repo's `railway.json` already pins `startCommand = "sh ./scripts/docker-entrypoint.sh"`, which Railway will fall back to.

**Worker:** same root (repo root), `dockerfilePath = services/api/Dockerfile.worker`, `PROCESS_ROLE=worker`, see `infrastructure/railway/worker.railway.toml`.

> **Why repo root?** The pnpm workspace requires `pnpm-workspace.yaml`, `pnpm-lock.yaml`, root `package.json`, and `packages/*` to install correctly. Setting Railway's root directory to `services/api` breaks workspace resolution and shared package imports.

### Local validation

```bash
# Build (from repo root)
docker build -f services/api/Dockerfile -t schoolvan-api .
docker build -f services/api/Dockerfile.worker -t schoolvan-worker .

# Run
docker run --rm -p 4000:4000 \
  -e DATABASE_URL=postgresql://... -e DIRECT_DATABASE_URL=postgresql://... \
  -e REDIS_URL=rediss://... \
  -e JWT_ACCESS_SECRET=... -e JWT_REFRESH_SECRET=... \
  -e JWT_ACCESS_TTL=900s -e JWT_REFRESH_TTL=30d \
  -e CORS_ORIGINS=http://localhost:3000 \
  -e FCM_PROJECT_ID=replace -e FCM_CLIENT_EMAIL=replace -e FCM_PRIVATE_KEY=replace \
  -e GOOGLE_MAPS_API_KEY=replace \
  schoolvan-api
```

## Vercel (Web)

| Setting | Value |
|---------|--------|
| Root | `apps/web` |
| Install | Monorepo `pnpm install --filter @schoolvan/web...` |
| Build | `pnpm --filter @schoolvan/web build` |

## GitHub secrets (production environment)

See `infrastructure/github-actions/README.md`.

## Post-deploy smoke

```bash
API_URL=https://your-api.up.railway.app pnpm health
API_URL=https://your-api.up.railway.app pnpm smoke
```
