# Database recovery runbook

## Symptoms

- Readiness `database: error`
- 5xx on all authenticated routes
- Prisma connection pool exhausted

## Diagnosis

1. Supabase status page
2. `DATABASE_URL` pooler (6543) vs `DIRECT_DATABASE_URL` (5432)
3. Connection count in Supabase dashboard

## Recovery

### Connection exhaustion

1. Restart API + Worker on Railway (drops pools)
2. Reduce `connection_limit` in pooler URL if set too high per replica

### Data corruption / bad migration

1. **Do not** run `migrate reset` on production
2. Restore from Supabase point-in-time backup (Pro plan)
3. Re-run `pnpm prisma migrate deploy` from known-good migration hash

### Post-restore validation

```bash
cd services/api && pnpm prisma migrate status
API_URL=... bash infrastructure/scripts/health-check.sh
```

## Backup validation (monthly)

1. Restore backup to staging project
2. Run smoke tests + login
3. Document RPO/RTO in [BACKUP-DR.md](../docs/BACKUP-DR.md)
