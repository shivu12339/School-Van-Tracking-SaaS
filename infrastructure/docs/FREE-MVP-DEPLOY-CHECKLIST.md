# Free MVP Deploy Checklist

Use this after copying env templates and connecting cloud accounts.

## Env files (templates only — set real values in Railway / Vercel)

| File | Purpose |
|------|---------|
| `services/api/.env.production.example` | Railway API + Worker |
| `apps/web/.env.production.example` | Vercel |
| `infrastructure/env/.env.production.example` | Full reference |

## 1. Supabase

- [ ] Create project
- [ ] Run `infrastructure/scripts/enable-postgis.sql` in SQL Editor
- [ ] `DATABASE_URL` = pooler `:6543` + `?pgbouncer=true`
- [ ] `DIRECT_DATABASE_URL` = direct `:5432`
- [ ] `cd services/api && pnpm prisma migrate deploy && pnpm prisma db seed`

## 2. Upstash

- [ ] Create Redis → copy `REDIS_URL` (`rediss://`)
- [ ] Set on Railway API **and** Worker

## 3. Railway API (`services/api`)

- [ ] Root directory: `services/api`
- [ ] Dockerfile: `Dockerfile` (uses `railway.toml` healthcheck)
- [ ] `PROCESS_ROLE=api`
- [ ] Enable WebSockets
- [ ] `CORS_ORIGINS` = your Vercel URL (+ localhost for dev)
- [ ] Deploy → note public URL → `https://xxx.up.railway.app`

## 4. Railway Worker

- [ ] Same repo, `Dockerfile.worker`
- [ ] `PROCESS_ROLE=worker`
- [ ] Same `DATABASE_URL`, `REDIS_URL`, `FCM_*`

## 5. Vercel (`apps/web`)

- [ ] Root: `apps/web`
- [ ] `NEXT_PUBLIC_API_BASE_URL` = `{RAILWAY_URL}/api/v1`
- [ ] `NEXT_PUBLIC_WS_BASE_URL` = `{RAILWAY_URL}` (no `/api/v1`)
- [ ] `JWT_ACCESS_SECRET` = same as API

## 6. Smoke test

```bash
curl -s https://YOUR-API.up.railway.app/
curl -s https://YOUR-API.up.railway.app/api/v1/health
curl -s https://YOUR-API.up.railway.app/api/v1/health/ready
```

Login: `superadmin@schoolvan.app` / `Admin@12345` (after seed).

## 7. Optional services

- Cloudinary: upload endpoints work with empty vars skipped in dev; set for production uploads
- Firebase: `FCM_*` — API boots without valid keys; set for push

## Local build note

Root `pnpm build` needs **Node.js ≥ 22.13**. API/web can be built with `npm run build` inside each package on Node 22.8+.
