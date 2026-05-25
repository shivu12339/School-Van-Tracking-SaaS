# Vercel deployment steps - School Van Web (Next.js 15)

The web app lives at `apps/web` and is part of the pnpm monorepo.
Vercel needs to install dependencies from the **repo root** so workspace
packages (`packages/*`) resolve correctly.

## 0. Prerequisites

- API already deployed to Railway (you need its public URL).
- Repo connected to Vercel.
- `apps/web/vercel.json` checked in (already in this repo).

## 1. Import the project

| Setting                | Value                                            |
| ---------------------- | ------------------------------------------------ |
| Framework preset       | **Next.js**                                      |
| **Root Directory**     | `apps/web`                                       |
| Include source files outside Root Directory | **enabled** (uses repo root for pnpm)            |
| **Install Command**    | `pnpm install --frozen-lockfile`                 |
| **Build Command**      | `pnpm --filter @schoolvan/web build`             |
| **Output Directory**   | `.next`                                          |
| **Node.js Version**    | 22.x                                             |

Vercel will auto-detect monorepo support thanks to `apps/web/vercel.json`.

## 2. Environment variables

Add per environment (Production / Preview / Development). All
`NEXT_PUBLIC_*` variables are exposed to the browser - never put
server-only secrets in them.

### Production

| Variable                      | Example                                   | Notes                                      |
| ----------------------------- | ----------------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_API_URL`         | `https://your-api.up.railway.app/api/v1`  | REST base URL                              |
| `NEXT_PUBLIC_WS_URL`          | `https://your-api.up.railway.app`         | Socket.IO origin (no `/socket.io` suffix)  |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | _Maps JS API key, restricted to *.vercel.app_ | Optional - map shows fallback otherwise   |
| `NEXT_PUBLIC_SENTRY_DSN`      | _from Sentry_                             | Optional                                   |
| `JWT_ACCESS_SECRET`           | _same value as Railway API_               | Required by Next middleware to verify access tokens |

### Preview

Same keys, point at a Railway preview environment if you have one;
otherwise reuse production values.

## 3. Wire CORS back on Railway

After the first Vercel deploy you'll have a domain like
`schoolvan.vercel.app` and per-deploy preview URLs. Update the API
service:

```
CORS_ORIGINS=https://schoolvan.vercel.app,https://*.vercel.app,http://localhost:3000
FRONTEND_URL=https://schoolvan.vercel.app
```

The API CORS resolver in `services/api/src/config/app.config.ts`
automatically merges `CORS_ORIGINS`, `FRONTEND_URL`, `WEB_APP_URL`,
`VERCEL_URL`, and `RAILWAY_PUBLIC_DOMAIN` into a deduped allow-list -
no code change required.

## 4. WebSockets / Socket.IO

Vercel's edge does not proxy Socket.IO. The web app talks **directly**
to the Railway API at `NEXT_PUBLIC_WS_URL`. Make sure:

- Railway -> API service -> Settings -> Networking -> WebSockets is on.
- `NEXT_PUBLIC_WS_URL` includes the protocol (`https://`).
- The browser console shows `socket.io/?EIO=4&transport=polling` then
  upgrades to `websocket`.

## 5. Auth setup

The web app uses HTTP-only cookies issued by the Railway API. For
cross-site cookies to work:

- API must run on HTTPS (Railway gives you `*.up.railway.app` by default).
- API must set `SameSite=None; Secure` on auth cookies (already configured
  via `AUTH_USE_SECURE_COOKIES=true` on Railway).
- Web app's `NEXT_PUBLIC_API_URL` must use HTTPS, otherwise the browser
  drops the cookie.
- `CORS_ORIGINS` on the API must list the exact Vercel domain (no `*`
  if cookies are involved).

## 6. SSR troubleshooting

| Symptom                                                 | Fix                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `Cannot find module '@schoolvan/shared'`                | Set Install/Build commands above; **do not** select "Vercel default" install.        |
| `getStaticProps` build hangs / timeout                  | Check `apps/web/next.config.*` for `output: 'standalone'` and remove unused fetches in build. |
| `fetch failed` during build                              | Build runs in Vercel's CI - the API is not reachable from build steps. Use SSR/ISR with `revalidate`. |
| 401 on every request                                    | Cookie not sent - confirm API and web are both HTTPS and `CORS_ORIGINS` matches the Vercel domain exactly. |
| Hydration mismatch on map page                          | Map JS API key not set or restricted to a different domain.                           |
| Build succeeds but socket connection idle                | `NEXT_PUBLIC_WS_URL` missing protocol or pointed at the wrong domain.                 |
| Cookie present in dev, missing in prod                  | Make sure both Vercel and Railway are HTTPS; Lax cookies cannot cross sites.          |
| Production build pulls dev devDependencies              | Check `apps/web/package.json` - move build-time deps under `dependencies`.            |

## 7. Validate

```bash
API_URL=https://your-api.up.railway.app \
  WEB_URL=https://schoolvan.vercel.app \
  pnpm validate:live
```

Should exit 0 and report the CORS preflight from the Vercel origin
returns the correct `Access-Control-Allow-Origin`.
