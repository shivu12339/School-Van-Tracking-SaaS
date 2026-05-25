# Monorepo Foundation (Step 1)

Production Turborepo + pnpm workspace for School Van SaaS.

## Architecture decisions

| Decision | Rationale |
|----------|-----------|
| **pnpm workspaces** | Fast installs, strict dependency graph, `workspace:*` protocol |
| **Turborepo** | Cached builds/tests, parallel dev, task pipeline |
| **`packages/config`** | Single source for ESLint, TS, Prettier — no config drift |
| **`packages/shared`** | API contracts, roles, socket events — used by API + web |
| **Flutter outside pnpm** | `apps/driver`, `apps/parent` use Dart pub; not in Node graph |
| **Husky + lint-staged** | Enforce format/lint before commit |
| **Commitlint** | Conventional commits for changelog automation |

## Folder structure

```txt
school-van-saas/
├── apps/
│   ├── web/                 # @schoolvan/web — Next.js 15 admin
│   ├── driver/              # Flutter (pubspec, not pnpm)
│   └── parent/              # Flutter (pubspec, not pnpm)
├── services/
│   └── api/                 # @schoolvan/api — NestJS
├── packages/
│   ├── config/              # @schoolvan/config — tooling
│   └── shared/              # @schoolvan/shared — types/constants
├── infrastructure/          # Docker, Railway, Vercel (Phase 11)
├── qa/                      # Testing & checklists (Phase 12)
├── tests/load/              # k6 load tests
├── docs/
├── .github/workflows/
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Prerequisites

- Node.js **22+**
- pnpm **10+** — `corepack enable && corepack prepare pnpm@10.11.0 --activate`
- Docker Desktop (local Postgres + Redis)
- Flutter 3.24+ (mobile apps only)

## Installation

```bash
# From repository root
corepack enable
pnpm install

# Local infrastructure
pnpm docker:up

# Database
pnpm db:migrate
pnpm db:seed

# Development (API + Web in parallel)
pnpm dev
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all Node apps (turbo parallel) |
| `pnpm dev:api` | NestJS API only |
| `pnpm dev:web` | Next.js admin only |
| `pnpm build` | Production build (respects dependency graph) |
| `pnpm lint` | ESLint across workspace |
| `pnpm test` | Tests across workspace |
| `pnpm check-types` | TypeScript `tsc --noEmit` |
| `pnpm format` | Prettier write |
| `pnpm format:check` | Prettier CI check |
| `pnpm setup` | install + docker + migrate + seed |

## Environment

Copy root `.env.example` → `.env`. Per-environment templates: `infrastructure/env/`.

## Scalability

- Add new Node package under `packages/` or `services/` — auto-included by `pnpm-workspace.yaml`
- Turbo `^build` ensures `@schoolvan/shared` builds before dependents
- AWS-ready: each app is independently deployable (Railway API, Vercel web)

## Security

- `.env` gitignored; only `.env.example` committed
- No secrets in `packages/shared`
- Husky blocks unformatted/unlinted staged TS

## Production considerations

- Commit `pnpm-lock.yaml` once generated (`pnpm install` at root)
- CI: `.github/workflows/monorepo.yml` + existing deploy workflows
- Use `pnpm deploy` or Docker per service for production images

## Next implementation step

**Step 2** — NestJS backend foundation (module boundaries, global pipes, Swagger, health).
