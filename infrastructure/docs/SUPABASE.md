# Supabase PostgreSQL + PostGIS

## Provisioning

1. Create Supabase project (free tier: 500MB DB, 2 projects).
2. Enable PostGIS before migrations:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Prisma connection strategy

| Variable | Use |
|----------|-----|
| `DATABASE_URL` | Runtime — **Supavisor pooler** (port 6543) |
| `DIRECT_DATABASE_URL` | Migrations & `prisma db seed` — direct (port 5432) |

Configured in `services/api/prisma/schema.prisma` via `directUrl`.

## Connection pooling

- Use **transaction mode** pooler for NestJS (short queries).
- Avoid long transactions holding pool connections.
- Set `connection_limit=10` on pooled URL for Railway single instance.

## Scaling awareness

| Limit (free) | Mitigation |
|--------------|------------|
| Connection cap | Pooler + low `connection_limit` |
| CPU | Index geo queries, batch tracking writes |
| Storage | Archive old `tracking_logs` |

## Backups

- Supabase daily backups on Pro; free tier: manual `pg_dump` via `scripts/backup-database.sh`.
- Test restore quarterly on staging.

## AWS migration

Supabase → **RDS PostgreSQL** with PostGIS extension.  
Change `DATABASE_URL` only — Prisma schema unchanged.
