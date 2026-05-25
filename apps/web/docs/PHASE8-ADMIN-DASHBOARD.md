# Phase 8 — Admin Dashboard (Next.js 15)

## Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS + ShadCN-style UI primitives
- TanStack Query (server state) + Zustand (UI/realtime)
- Socket.IO client for live tracking
- Google Maps via `@react-google-maps/api`
- Recharts for analytics

## Run locally

```bash
# From repo root
pnpm install
pnpm --filter @schoolvan/web dev
```

Set `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_BASE_URL=http://localhost:4000
API_INTERNAL_URL=http://localhost:4000/api/v1
JWT_ACCESS_SECRET=<same as API JWT_ACCESS_SECRET>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your key>
```

## Auth

- Login → `POST /api/auth/login` sets httpOnly `sv_access_token` + `sv_refresh_token`
- Middleware protects `/super-admin/*` and `/admin/*`
- Client API calls proxy through `/api/backend/*` with server-injected Bearer token

## Routes

| Area | Path |
|------|------|
| Super Admin | `/super-admin`, `/super-admin/schools`, `/subscriptions`, `/analytics`, `/health` |
| School Admin | `/admin`, `/admin/tracking`, `/admin/drivers`, … |
| Auth | `/login` |

## Seeded logins

- Super admin: `superadmin@schoolvan.app` / `Admin@12345` (no school code)
- School admin: `admin@demo-school.app` / `Admin@12345` + school code `SVT-DEMO-001`

## Vercel deployment

1. Set root directory to `apps/web`
2. Add environment variables (mirror `.env.local`)
3. Build command: `pnpm build`
4. Enable edge-compatible middleware

## Fleet modules

Drivers, vans, students, parents, routes, trips pages use the generic `ResourceListPage` and will populate automatically when backend CRUD modules are enabled.
