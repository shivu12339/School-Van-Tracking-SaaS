# Backup & Disaster Recovery

## PostgreSQL (Supabase)

| Method | Frequency |
|--------|-----------|
| Supabase automated (Pro) | Daily |
| Manual `pg_dump` | Weekly via `scripts/backup-database.sh` |
| Point-in-time | Enable on Pro before production launch |

**RTO target (MVP):** 4 hours  
**RPO target (MVP):** 24 hours  

## Redis (Upstash)

- Not a source of truth — rebuild caches from DB on restore.
- Document queue drain procedure if worker stuck.

## Cloudinary

- Enable backup add-on or periodic URL export list.
- Migration to S3 includes bulk transfer.

## Recovery procedure

1. Restore DB from latest dump to new Supabase project.
2. Update `DATABASE_URL` / `DIRECT_DATABASE_URL` in Railway.
3. Redeploy API + Worker.
4. Verify `/api/v1/health/ready`.
5. Run smoke tests (login, live trip, push test).

## Disaster scenarios

| Event | Action |
|-------|--------|
| Railway outage | Failover prep: keep Docker image in GHCR, deploy to Fly.io/ECS |
| Supabase outage | Restore to RDS (AWS migration playbook) |
| Redis outage | API degrades realtime; queue jobs retry when back |
