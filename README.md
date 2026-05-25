# School Van Tracking SaaS

Production-grade, multi-tenant SaaS platform for school transportation operations and live parent tracking.

## Core Stack

- Web Admin: Next.js 15, TypeScript, Tailwind CSS, ShadCN UI, React Query, Zustand
- Backend: NestJS, Prisma, PostgreSQL + PostGIS, Redis, Socket.IO
- Mobile: Flutter (Driver, Parent)
- Notifications: Firebase Cloud Messaging
- Infra: Docker, Railway, Vercel, Supabase, Upstash (MVP) → AWS (Phase 11)

## Monorepo layout

```txt
apps/web/          @schoolvan/web     Next.js admin
apps/driver/       Flutter driver
apps/parent/       Flutter parent
services/api/      @schoolvan/api     NestJS + Socket.IO
packages/config/   @schoolvan/config  ESLint, TS, Prettier
packages/shared/   @schoolvan/shared  Shared constants & types
infrastructure/    Deployment (Railway, Vercel, Docker)
qa/                Testing & production checklists
```

Full monorepo guide: [`docs/MONOREPO.md`](docs/MONOREPO.md).  
Backend foundation (Step 2): [`docs/BACKEND-FOUNDATION.md`](docs/BACKEND-FOUNDATION.md) · [`services/api/README.md`](services/api/README.md).

## Quick start

1. **Prerequisites:** Node.js 22+, pnpm 10+ (`corepack enable`), Docker Desktop.
2. Copy `.env.example` → `.env`.
3. One-shot setup:

```bash
pnpm install
pnpm setup          # docker + migrate + seed
pnpm dev            # API + Web in parallel
```

Or step by step: `pnpm docker:up` → `pnpm db:migrate` → `pnpm db:seed` → `pnpm dev`.

## QA & Release (Phase 12)

Testing, production hardening, and release checklists: [`qa/README.md`](qa/README.md).

```bash
cd services/api && pnpm test
cd apps/web && pnpm test
k6 run tests/load/k6/api-health.js
```

## Deployment (Phase 11)

MVP stack: **Vercel** (web) + **Railway** (API/worker) + **Supabase** (Postgres/PostGIS) + **Upstash** (Redis) + **Firebase** (FCM) + **Cloudinary** (media).

Full runbook: [`infrastructure/README.md`](infrastructure/README.md) and [`infrastructure/docs/MVP-DEPLOYMENT.md`](infrastructure/docs/MVP-DEPLOYMENT.md).

## Architectural Principles

- Strict multi-tenancy by `school_id` at the domain/service/repository layers.
- Role-based access control across `SUPER_ADMIN`, `SCHOOL_ADMIN`, `DRIVER`, `PARENT`.
- Event-driven notifications and real-time tracking via Redis pub/sub + Socket.IO.
- Production-safe defaults: structured logging, validation, throttling, secure headers, observability.

