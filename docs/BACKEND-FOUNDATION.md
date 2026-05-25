# Step 2 — NestJS Backend Foundation

Implemented in **`services/api`** (monorepo canonical path).

## Architecture decisions

| Layer | Implementation |
|-------|----------------|
| **Config** | `registerAs` namespaces — `app`, `database`, `redis`, `jwt`, `auth`, `firebase`, `maps`, `sentry`, `cloudinary` |
| **Validation** | Joi on boot + global `ValidationPipe` (whitelist, transform) |
| **Persistence** | `PrismaService` + soft-delete middleware |
| **Repositories** | `BaseRepository` → `TenantAwareRepository` for multi-tenant |
| **Cache/queues** | `RedisService` + `QueueRegistryService` (BullMQ) |
| **Realtime** | Socket.IO + `RedisIoAdapter` in bootstrap |
| **Security** | Helmet, compression, throttler, JWT guards, tenant guard |
| **Observability** | Winston, correlation IDs, request logging, Sentry hook |

## Security

- Passwords: Argon2/bcrypt (auth module)
- JWT access + refresh with rotation
- RBAC + permission guards globally registered
- `TenantGuard` blocks cross-school access
- CORS allowlist from env (no `*` in production)
- Rate limit: 120 req/min default (configurable)

## Scalability

- Stateless API containers behind load balancer
- Redis adapter for horizontal Socket.IO
- BullMQ workers in separate `PROCESS_ROLE=worker` container
- Connection pooling via Supabase pooler URL

## Production

- Swagger disabled when `NODE_ENV=production`
- JSON logs + file transports under `logs/`
- Graceful shutdown via Prisma hooks
- Readiness probe checks DB + Redis

## Extension points

1. Add domain module under `src/<domain>/`
2. Extend `TenantAwareRepository` for data access
3. Register BullMQ workers via `QueueRegistryService` or domain queue module
4. Add DTOs with `class-validator` decorators

Next: **Step 3** — Prisma schema hardening & migrations (if not already complete).
