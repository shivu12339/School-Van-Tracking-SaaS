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

# Run (placeholders below pass Joi validation and disable optional services)
docker run --rm -p 4000:4000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... -e DIRECT_DATABASE_URL=postgresql://... \
  -e REDIS_URL=rediss://... \
  -e JWT_ACCESS_SECRET=$(openssl rand -base64 48) \
  -e JWT_REFRESH_SECRET=$(openssl rand -base64 48) \
  -e JWT_ACCESS_TTL=900s -e JWT_REFRESH_TTL=30d \
  -e CORS_ORIGINS=http://localhost:3000 \
  -e FCM_PROJECT_ID=placeholder-project \
  -e FCM_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com \
  -e FCM_PRIVATE_KEY=placeholder-key \
  -e GOOGLE_MAPS_API_KEY=placeholder-key \
  schoolvan-api
```

## Production environment variables

Generate a fresh, copy-pasteable block:

```bash
pnpm env:railway          # human-readable + comments
pnpm env:railway -- --raw # newline KEY=VALUE for Railway "Raw editor"
```

| Variable | Required | Notes |
|----------|----------|-------|
| `NODE_ENV` | yes | `production` |
| `DATABASE_URL` | yes | Supabase pooler URL (`pgbouncer=true&connection_limit=10`) |
| `DIRECT_DATABASE_URL` | yes (migrations) | Supabase direct 5432 URL — used by `prisma migrate deploy` |
| `REDIS_URL` | yes | Upstash `rediss://default:…@…upstash.io:6379` (TLS) |
| `CORS_ORIGINS` | yes | Comma-separated; include Vercel + localhost |
| `FRONTEND_URL` | yes | Auto-merged into CORS allow-list |
| `JWT_ACCESS_SECRET` | yes | ≥ 32 chars; rotate per environment |
| `JWT_REFRESH_SECRET` | yes | ≥ 32 chars; **must differ from access secret** |
| `JWT_ACCESS_TTL` | yes | e.g. `900s` |
| `JWT_REFRESH_TTL` | yes | e.g. `30d` |
| `FCM_PROJECT_ID` / `FCM_CLIENT_EMAIL` / `FCM_PRIVATE_KEY` | yes (validated) | Use placeholders shown above to disable push at runtime |
| `GOOGLE_MAPS_API_KEY` | yes (validated) | Used client-side; placeholder is safe for the API |
| `SENTRY_DSN`, `CLOUDINARY_*`, `LOG_LEVEL`, `WRITE_LOG_FILES`, `SKIP_PRISMA_MIGRATE` | optional | See `services/api/.env.production.example` |

**Placeholder strategy.** `FcmProvider` detects `placeholder-…`, `your-project`, `@your-project.…`, `@placeholder.…`, `replace`, `disabled`, `none`, or `…` and skips Firebase init (push sends are simulated). The Joi schema still requires the keys to exist, so security stays strict in production while local dev and first-deploy boots succeed.

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
