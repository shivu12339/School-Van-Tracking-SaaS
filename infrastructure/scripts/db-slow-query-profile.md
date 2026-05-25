# Database slow query profiling

## Supabase

1. Dashboard → Database → Query performance
2. Enable `log_min_duration_statement = 500` on staging only
3. Review Prisma queries with `DEBUG=prisma:query` locally (never in production logs)

## High-risk queries

| Area | Pattern | Mitigation |
|------|---------|------------|
| Geofence | PostGIS distance on students | GiST index on location, school filter |
| Trip history | `tripStudent` + `trip.endedAt` sort | Composite index `(studentId, tripId)` |
| Notifications | `userId` + `createdAt` DESC | Index on `(schoolId, userId, createdAt)` |

## Prisma

```bash
cd services/api
pnpm prisma validate
```

Run migrations on staging before production: `pnpm prisma migrate deploy`
