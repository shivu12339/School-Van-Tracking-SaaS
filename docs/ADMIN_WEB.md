# Admin Web Dashboard (Step 9)

Next.js 15 admin dashboards for **Super Admin** and **School Admin**, implemented in `apps/web` (`@schoolvan/web`).

## Stack

- Next.js 15 App Router · TypeScript · Tailwind · ShadCN-style UI
- TanStack Query (server state) · Zustand (auth, tracking, notifications, UI)
- Axios via BFF proxy (`/api/backend/*`)
- Socket.IO (`/tracking`, `/notifications`)
- Google Maps (`@react-google-maps/api`)
- React Hook Form + Zod

## Routes

| Area | Path |
|------|------|
| Login | `/login` |
| Forgot password | `/forgot-password` |
| Super admin | `/super-admin/*` |
| School admin | `/admin/*` |
| Unauthorized | `/unauthorized` |

Middleware enforces JWT cookies + role (`SUPER_ADMIN` vs `SCHOOL_ADMIN`).

## Auth flow

1. `POST /api/auth/login` → sets HTTP-only refresh + access cookies
2. Client loads user via `AuthBootstrap` → `GET /auth/me`
3. Axios 401 → `POST /api/auth/refresh` → retry
4. Logout → `POST /api/auth/logout`

Super admin can **impersonate** a school from `/super-admin/schools`.

## Development

```powershell
pnpm install
pnpm dev:api    # terminal 1 — API :4000
pnpm dev:web    # terminal 2 — Web :3000
```

Copy `apps/web/.env.example` → `apps/web/.env.local`.

Demo login (after seed):

- Super admin: `superadmin@schoolvan.app` / `Admin@12345`
- School admin: `admin@demo-school.app` / `Admin@12345` / code `SVT-DEMO-001`

## Key modules

- `src/services/` — API clients (auth, schools, fleet, tracking, notifications)
- `src/modules/fleet/` — Reusable list + driver create form
- `src/components/tables/data-table.tsx` — Server pagination table
- `src/providers/` — Query, theme, socket, auth bootstrap

## Deploy (Vercel)

Set environment variables from `.env.example`. Point `API_INTERNAL_URL` to your private API URL for server-side proxy routes.
