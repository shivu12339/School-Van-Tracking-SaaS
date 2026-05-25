# Vercel — Admin Dashboard

## Project setup

1. Import monorepo in [Vercel](https://vercel.com).
2. **Root directory**: `apps/web`
3. **Framework**: Next.js 15
4. **Build**: `pnpm build` (enable Corepack)

## Environment variables

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.yourdomain.com/api/v1` |
| `NEXT_PUBLIC_WS_BASE_URL` | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps browser key (HTTP referrer restricted) |
| `API_INTERNAL_URL` | Same as public API URL (server-side proxy) |
| `JWT_ACCESS_SECRET` | Must match API secret (cookie signing) |

## API proxy

Browser calls `/api/backend/*` → Next.js route → Railway API with httpOnly cookies.  
No CORS exposure of JWT to client JS.

## WebSockets

Dashboard connects **directly** to Railway:

`NEXT_PUBLIC_WS_BASE_URL` + namespace (`/tracking`, `/notifications`).

Vercel does not proxy WebSockets — this is correct for MVP.

## Domains

- `admin.yourdomain.com` → Vercel production
- Add domain in Vercel → configure DNS CNAME

## Preview deployments

Set preview env vars pointing to **staging API** (`staging-api.yourdomain.com`).
