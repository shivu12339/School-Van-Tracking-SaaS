# Supabase setup - PostgreSQL + PostGIS for School Van

The API uses Supabase Postgres for primary storage with the **PostGIS**
extension enabled for geospatial queries (van location, geofences,
route polygons). Two connection strings are needed:

- **Pooler URL** (`DATABASE_URL`) - used at runtime via PgBouncer.
  Required for serverless / containerised workloads.
- **Direct URL** (`DIRECT_DATABASE_URL`) - used by `prisma migrate deploy`
  because PgBouncer transaction pooling does not support migrations.

## 1. Create the project

1. Sign in at <https://supabase.com>.
2. **New project** -> name: `schoolvan-prod`, region: closest to your
   Railway region (US-East-1 matches Railway's `us-east4` for example).
3. Choose a strong database password and **save it in a password
   manager** - it appears in both connection strings.
4. Wait until the project is `Running`.

## 2. Enable PostGIS

Project -> SQL Editor -> New query -> paste and run:

```sql
-- enables PostGIS so Prisma's Unsupported("geometry") columns work
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- optional: helpful diagnostics extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- verify
SELECT postgis_full_version();
```

Or run from your laptop:

```bash
psql "$DIRECT_DATABASE_URL" -f infrastructure/scripts/enable-postgis.sql
```

## 3. Collect the connection strings

Project -> Settings -> Database. You need both:

### Pooler (use as `DATABASE_URL`)

`Connection pooling -> Connection string -> Transaction`

```
postgresql://postgres.<REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10
```

Required query params:

- `pgbouncer=true` - tells Prisma not to issue prepared statements that
  PgBouncer cannot route.
- `connection_limit=10` - keeps the per-instance pool well below
  Supabase's free-tier total. Bump only if you have multiple replicas
  and have raised the Supabase pool size to match.

### Direct (use as `DIRECT_DATABASE_URL`)

`Connection string -> URI`

```
postgresql://postgres.<REF>:<PASSWORD>@db.<REF>.supabase.co:5432/postgres
```

This is what `prisma migrate deploy` uses inside `docker-entrypoint.sh`.
Do **not** use the pooler here.

## 4. Run migrations

`docker-entrypoint.sh` runs `prisma migrate deploy` automatically on
the API container's first boot. To run from your laptop:

```bash
DIRECT_DATABASE_URL=postgresql://... \
  pnpm --filter @schoolvan/api prisma:deploy
```

Optionally seed:

```bash
DATABASE_URL=postgresql://... \
DIRECT_DATABASE_URL=postgresql://... \
  pnpm --filter @schoolvan/api prisma:seed
```

## 5. Prisma notes

- The schema declares `extensions = [postgis]` in
  `services/api/prisma/schema.prisma`. Migrations include the
  `CREATE EXTENSION IF NOT EXISTS "postgis"` SQL.
- Geometry/geography columns are `Unsupported("geometry(Point, 4326)")`
  - Prisma cannot select them as scalar fields, so the repository layer
  uses raw SQL (`$queryRaw`) for ST_* operations.
- `prisma generate` regenerates `node_modules/.prisma/client` and is
  baked into the Docker build's `deploy` stage. You do **not** need to
  run it on Railway.
- `prisma migrate dev` is dev-only - never run it against production.
  Production uses `prisma migrate deploy` exclusively.

## 6. Backups + retention

Supabase free tier: daily PITR off, 7-day point-in-time WAL on
PRO. For self-managed backups see
`infrastructure/scripts/backup-database.sh` and
`infrastructure/docs/BACKUP-DR.md`.

## 7. Troubleshooting

| Symptom                                              | Fix                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `prepared statement "s0" already exists`             | Add `pgbouncer=true` to `DATABASE_URL` pooler URL.                                               |
| `permission denied for schema public`                | Make sure migrations are run with the project's service role (the password from step 1).         |
| `ERROR: function st_makepoint does not exist`        | PostGIS not enabled - rerun the SQL block above.                                                 |
| `migrate deploy` succeeds locally, fails on Railway  | The container uses `DIRECT_DATABASE_URL`, **not** `DATABASE_URL`. Make sure both are set.        |
| Slow first query after idle                          | Pooler scales to zero on free tier. Add a 1-minute readiness ping (Railway healthcheck does this). |
| Geometry columns appear as `null` in Prisma          | They cannot be selected directly - use the repository's raw queries (`ST_AsGeoJSON`).            |
| Out-of-connections errors under load                 | Lower `connection_limit` per instance or upgrade Supabase plan.                                  |
