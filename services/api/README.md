# @schoolvan/api — NestJS Backend

Enterprise REST + WebSocket API for School Van Tracking SaaS.

> Monorepo path: `services/api` (not `apps/backend-api`). Same architecture as Step 2 spec.

## Stack

- NestJS 11, TypeScript strict
- Prisma + PostgreSQL + PostGIS
- Redis (ioredis) + Socket.IO Redis adapter
- BullMQ (platform queues + notification workers)
- Winston logging, Joi env validation
- Helmet, compression, throttling, CORS

## Structure

```txt
src/
├── main.ts                 # Entry → bootstrap()
├── bootstrap.ts            # App factory, middleware, sockets
├── app.module.ts           # Root module
├── config/                 # Typed registerAs configs + Joi schema
├── common/                 # Filters, pipes, interceptors, middleware
├── prisma/                 # PrismaService + BaseRepository
├── redis/                  # RedisService (retry, health)
├── queues/                 # BullMQ QueueRegistryService
├── health/                 # Liveness + readiness
├── websocket/              # WebSocket module marker
├── auth/ tracking/ ...     # Domain modules
└── worker.main.ts          # BullMQ worker process
```

## Commands

```bash
# From repo root
pnpm install
pnpm docker:up
pnpm db:migrate
pnpm db:seed

# Development
pnpm dev:api
# or
cd services/api && pnpm dev

# Production build
pnpm --filter @schoolvan/api build
pnpm --filter @schoolvan/api start:prod

# Worker only
PROCESS_ROLE=worker pnpm --filter @schoolvan/api start:worker

# Tests
pnpm --filter @schoolvan/api test
```

## Environment

Copy root `.env.example`. Required:

- `DATABASE_URL`, `DIRECT_DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (32+ chars)
- `CORS_ORIGINS`
- `FCM_*`, `GOOGLE_MAPS_API_KEY`

## API standards

| Item | Value |
|------|-------|
| Base path | `/api/v1` |
| Success shape | `{ success, data, meta }` |
| Error shape | `{ success: false, error: { code, message }, meta }` |
| Correlation | `X-Request-Id` header |
| Docs (non-prod) | `/api/docs` |

## Health

- `GET /api/v1/health` — liveness
- `GET /api/v1/health/ready` — Postgres + Redis

## Docker

```bash
docker build -t schoolvan-api -f services/api/Dockerfile services/api
docker run -p 4000:4000 --env-file .env schoolvan-api
```

See `infrastructure/` for Railway production deploy.
