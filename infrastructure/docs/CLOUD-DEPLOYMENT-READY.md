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
| Root | `services/api` |
| Dockerfile | `Dockerfile` |
| Config | `railway.toml` or `railway.json` |
| Health | `GET /api/v1/health/ready` |
| WebSockets | Enabled |
| Entrypoint | `scripts/docker-entrypoint.sh` (migrate + start) |

**Worker:** same root, `Dockerfile.worker`, `PROCESS_ROLE=worker`, see `infrastructure/railway/worker.railway.toml`.

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
