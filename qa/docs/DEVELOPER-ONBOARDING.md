# Developer Onboarding

## Setup

1. Clone repo, copy `.env.example` → `.env`
2. `docker compose up -d` (Postgres + Redis)
3. `cd services/api && pnpm install && pnpm prisma migrate deploy && pnpm prisma db seed`
4. `pnpm dev` from repo root (or API + web separately)

## Run tests

```bash
cd services/api && pnpm test
cd apps/web && pnpm test
```

## Key docs

- Architecture: root `README.md`
- Deployment: `infrastructure/README.md`
- QA: `qa/README.md`
- API tracking: `services/api/src/tracking/README.md`

## Code standards

- Multi-tenant: always filter by `schoolId`
- No secrets in git
- PR requires CI green

## API docs

- Swagger: `http://localhost:4000/api/docs` (dev)
