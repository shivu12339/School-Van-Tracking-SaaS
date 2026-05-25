# Database layer — Prisma, PostgreSQL, PostGIS

Production database implementation for the School Van Tracking SaaS platform.

## Stack

| Layer | Technology |
|-------|------------|
| ORM | Prisma 6 |
| Database | PostgreSQL 15+ |
| Geospatial | PostGIS (`geography(Point, 4326)`) |
| Hot cache | Redis (active trips, locations, ETA) |
| IDs | UUID v4 (`@default(uuid())`) |
| Tenancy | `school_id` on all tenant tables |
| Soft delete | `deleted_at` + Prisma middleware |

## Layout

```
services/api/prisma/
├── schema.prisma              # Full domain schema
├── migrations/
│   ├── 20260515000000_step3_initial_baseline/
│   ├── 20260516120000_phase7_notifications/
│   └── 20260519130000_step3_postgis_optimization/
├── seed.ts                    # Orchestrator
├── seed/                      # Modular seeds
├── helpers/                   # Geo, pagination, batch, archive, tenant
├── extensions/                # Prisma client extensions
└── sql/                       # PostGIS reference scripts

services/api/src/prisma/
├── prisma.service.ts          # Client + middleware
├── tenant.middleware.ts       # school_id enforcement
├── geo.service.ts             # PostGIS queries
└── repositories/              # Tracking + tenant base
```

## Commands

```bash
cd services/api

# Generate client after schema changes
pnpm prisma:generate

# Local dev: create + apply migration
pnpm prisma:migrate --name descriptive_change

# CI / production: apply pending migrations only
pnpm prisma:deploy

# Seed roles, plans, demo school
pnpm prisma:seed

# Reset dev DB (destructive)
npx prisma migrate reset
```

### Test database

Use a separate database URL (e.g. `schoolvan_test`):

```bash
set DATABASE_URL=postgresql://user:pass@localhost:5432/schoolvan_test
set DIRECT_DATABASE_URL=%DATABASE_URL%
pnpm prisma:deploy
pnpm prisma:seed
```

See `services/api/test/prisma/test-database.ts` for Jest integration helpers.

## Multi-tenant strategy

1. **Schema**: Tenant tables include `school_id` with composite indexes `(school_id, …)`.
2. **Middleware** (`tenant.middleware.ts`): When AsyncLocalStorage has `schoolId`, all reads/writes on tenant models are scoped automatically.
3. **Repositories** (`TenantScopedRepository`, `TenantAwareRepository`): Merge `schoolId` into `where` from JWT user context.
4. **Super admin**: Set `bypassTenantScope: true` on the ALS store for cross-tenant jobs only.

## PostGIS

- Extension enabled in baseline migration.
- Decimal `latitude` / `longitude` columns are synced to `geography` via DB triggers (migration `step3_postgis_optimization`).
- GIST indexes on geography columns for proximity queries.
- Use `GeoService` or `prisma/helpers/geo.util.ts` for distance / radius raw SQL.

## Tracking logs (high volume)

| Concern | Approach |
|---------|----------|
| Writes | `TrackingRepository.insertBatch()` — 500-row chunks via `createMany` |
| Indexes | B-tree `(school_id, trip_id, event_timestamp)` + BRIN on `event_timestamp` |
| Hot path | Redis keys in `redis-cache.strategy.ts` (TTL 60–120s for locations) |
| Archival | `archiveTrackingLogs()` moves rows >90 days to `tracking_logs_archive` |
| Playback | `GeoService.getTripPlaybackPoints()` or paginated `findPlayback()` |

## Redis cache keys

| Key pattern | TTL | Purpose |
|-------------|-----|---------|
| `svt:school:{id}:trip:active:{tripId}` | 24h | Active trip snapshot |
| `svt:school:{id}:van:{vanId}:loc` | 120s | Latest van GPS |
| `svt:school:{id}:trip:{tripId}:loc` | 120s | Parent map position |
| `svt:school:{id}:eta:{tripId}:{studentId}` | 60s | ETA cache |
| `svt:session:{userId}:{deviceId}` | 7d | Session metadata |

## Security

- Refresh tokens stored as **hashes** (`token_hash` unique index).
- `audit_logs` append-only with actor + IP metadata.
- Soft deletes preserve referential history; hard delete only for `tracking_logs` archival.

## Production checklist

- Enable connection pooling (PgBouncer / Supabase pooler) — use `DATABASE_URL` for pooled, `DIRECT_DATABASE_URL` for migrations.
- Run `pnpm prisma:deploy` before app rollout.
- Schedule archival job (BullMQ) for `tracking_logs`.
- Daily logical backups + PITR on managed Postgres.
- Never edit merged migration SQL; add new migrations only.

## Demo credentials (after seed)

| Role | Email | Password | School code |
|------|-------|----------|-------------|
| Super admin | superadmin@schoolvan.app | Admin@12345 | — |
| School admin | admin@demo-school.app | Admin@12345 | SVT-DEMO-001 |
| Driver | driver@demo-school.app | Admin@12345 | SVT-DEMO-001 |
| Parent | parent@demo-school.app | Admin@12345 | SVT-DEMO-001 |
