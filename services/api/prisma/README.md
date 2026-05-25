# Prisma — School Van API

## Quick start

```bash
# From services/api
cp .env.example .env   # set DATABASE_URL + DIRECT_DATABASE_URL

pnpm prisma:generate
pnpm prisma:deploy     # fresh DB: applies baseline → phase7 → postgis optimization
pnpm prisma:seed
```

PostGIS is enabled automatically in migrations. For manual repair after restore, run `sql/enable-postgis.sql` and `sql/postgis-indexes.sql`.

## Migration order

1. `20260515000000_step3_initial_baseline` — full schema + PostGIS extension
2. `20260516120000_phase7_notifications` — incremental notification columns (idempotent)
3. `20260519130000_step3_postgis_optimization` — GIST/BRIN indexes, triggers, archive table

## Scripts

| Script | Command |
|--------|---------|
| Generate client | `pnpm prisma:generate` |
| Dev migration | `pnpm prisma:migrate --name <name>` |
| Deploy | `pnpm prisma:deploy` |
| Seed | `pnpm prisma:seed` |
| Reset (dev) | `npx prisma migrate reset` |

Full documentation: [`docs/DATABASE.md`](../../../docs/DATABASE.md)
