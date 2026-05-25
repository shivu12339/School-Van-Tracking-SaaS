# Railway deployment steps - School Van API + Worker

Use this checklist top-to-bottom for both the API and the BullMQ worker
service. Both run from the same Docker image family and the same repo, only
the Dockerfile path and `PROCESS_ROLE` differ.

## 0. Prerequisites

- Supabase project created (see `infrastructure/docs/SUPABASE-SETUP.md`)
- Upstash Redis database created (see `infrastructure/docs/UPSTASH-SETUP.md`)
- This repo pushed to GitHub
- Railway account connected to GitHub

## 1. Generate environment variables locally

```bash
# Produces fresh JWT secrets and a copy-pasteable Railway block
pnpm env:railway -- --raw
```

Replace the bracketed values with the real Supabase/Upstash URLs you
collected in step 0. **Never** paste real credentials into the chat,
git, or screenshots.

## 2. Create the API service

| Setting                                         | Value                                                  |
| ----------------------------------------------- | ------------------------------------------------------ |
| New Service                                     | Deploy from GitHub repo                                |
| Repository                                      | this repo                                              |
| **Root Directory**                              | _(empty)_ - **must be repo root**                      |
| Builder                                         | Dockerfile                                             |
| **Dockerfile Path**                             | `services/api/Dockerfile`                              |
| **Start Command (dashboard field)**             | _(empty - leave blank)_                                |
| Watch Paths                                     | `services/api/**`, `packages/**`, `pnpm-lock.yaml`     |
| Port                                            | injected automatically (do **not** set `API_PORT`)     |
| Healthcheck path                                | `/api/v1/health/ready`                                 |
| Healthcheck timeout                             | 60s                                                    |

> **Why empty Root Directory?** Pnpm needs the workspace root
> (`pnpm-workspace.yaml`, `pnpm-lock.yaml`, root `package.json`,
> `packages/*`). Setting it to `services/api` breaks workspace resolution.

> **Why empty Start Command?** The runtime image intentionally has no
> `pnpm` binary. Anything in the dashboard field overrides the
> Dockerfile `CMD` and crashes the container with `pnpm: not found`.
> The repo's `railway.json` already pins
> `startCommand = "sh ./scripts/docker-entrypoint.sh"`.

## 3. Set environment variables (Variables -> Raw Editor)

Paste the block produced by `pnpm env:railway -- --raw`, then verify:

- **Required (validated by Joi):** `NODE_ENV`, `DATABASE_URL`,
  `DIRECT_DATABASE_URL`, `REDIS_URL`, `CORS_ORIGINS`, `FRONTEND_URL`,
  `JWT_ACCESS_SECRET` (32+ chars), `JWT_REFRESH_SECRET` (32+ chars,
  must differ), `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `FCM_PROJECT_ID`,
  `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`, `GOOGLE_MAPS_API_KEY`.
- **Placeholders accepted (feature auto-disables):** any FCM_*
  containing `placeholder`, `your-project`, `@placeholder.`, `replace`,
  `disabled`, `none`, or `...` will skip Firebase Admin init at boot.
- **Optional:** `SENTRY_DSN`, `CLOUDINARY_*`, `LOG_LEVEL`,
  `WRITE_LOG_FILES`, `SKIP_PRISMA_MIGRATE`.

After the first deploy you will copy the Railway public URL into
`CORS_ORIGINS` and `FRONTEND_URL` of the **other** service if needed.

## 4. Enable WebSockets

`Settings -> Networking -> WebSockets`: **enabled**. Without this,
Socket.IO `/socket.io/?EIO=4&transport=polling` returns 404 and live
tracking will not work.

## 5. Create the Worker service (same repo)

Repeat steps 2 and 3 with these differences:

| Setting             | Value                              |
| ------------------- | ---------------------------------- |
| Dockerfile Path     | `services/api/Dockerfile.worker`   |
| `PROCESS_ROLE`      | `worker`                           |
| Healthcheck path    | _(none - Railway default TCP probe)_ |
| Public networking   | _(off - worker is internal)_       |
| `SKIP_PRISMA_MIGRATE` | `true` (only the API runs migrations) |

Reuse the same `DATABASE_URL`, `REDIS_URL`, JWT secrets, etc.

## 6. First deploy

1. Click **Deploy**.
2. Watch the build log - the multi-stage Docker build downloads pnpm,
   runs `pnpm --filter @schoolvan/api --legacy deploy /out`, generates
   Prisma, and copies a slim `node_modules` into the runtime image.
3. On the first run, `docker-entrypoint.sh` runs `prisma migrate deploy`
   against `DIRECT_DATABASE_URL`, then starts the API on `$PORT`.
4. Wait for `Healthcheck succeeded` in the logs.

## 7. Validate

Local from anywhere:

```bash
API_URL=https://your-api.up.railway.app pnpm validate:live
API_URL=https://your-api.up.railway.app pnpm smoke
```

Both should exit `0`. The validator prints DB/Redis/queue check
results and verifies the Socket.IO handshake.

## 8. Redeploy

Pushing to `main` triggers `.github/workflows/deploy-api.yml`, which
runs Prisma migrate, builds the Docker image with `context: .`, and
calls Railway's redeploy webhook. To redeploy manually:

- Railway dashboard -> Service -> **Redeploy**.
- CLI: `railway up --service api`.

## 9. Troubleshooting

| Symptom                                              | Fix                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `pnpm: not found` on start                           | Clear the dashboard Start Command field; let the Dockerfile CMD run.                              |
| `EACCES: permission denied, mkdir 'logs'`            | Already fixed in `Dockerfile` (`mkdir -p /app/logs && chown -R app:app /app`). Pull latest main.  |
| `Required environment variables are missing`        | Re-run `pnpm env:railway -- --raw` and verify every key in the table above is set.               |
| `Cannot resolve workspace package @schoolvan/shared` | Root directory must be empty (repo root). Do **not** set `services/api`.                          |
| Healthcheck fails: `database error`                  | `DATABASE_URL` should be the **pooler** URL with `pgbouncer=true&connection_limit=10`.            |
| Healthcheck fails: `redis error`                     | Use the **TLS** Upstash URL (`rediss://`) - not `redis://`.                                       |
| Socket.IO handshake returns 404                      | Enable WebSockets in Settings -> Networking.                                                      |
| Migration loop / repeated `migrate deploy`           | Set `SKIP_PRISMA_MIGRATE=true` on the worker - only the API should run migrations.                |
| 401 expected, got 200 on `/auth/me`                  | Auth guard not active - check `JwtAuthGuard` global registration.                                |
| CORS preflight missing Allow-Origin                  | Add the Vercel domain to `CORS_ORIGINS` (comma-separated, no trailing `/`).                       |
