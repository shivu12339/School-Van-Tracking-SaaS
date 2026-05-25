# Rollback Strategy

## API (Railway)

1. Railway dashboard → Deployments → **Rollback** previous image
2. If migration was destructive: restore DB snapshot first
3. Verify `/api/v1/health/ready`

**Do not** run `prisma migrate rollback` in production without DBA review.

## Web (Vercel)

1. Vercel → Deployments → Promote previous production build
2. Purge CDN if static assets changed

## Database

1. Supabase → Backups → restore to new project OR point-in-time (Pro)
2. Update `DATABASE_URL` if endpoint changes
3. Re-run `prisma migrate deploy` to confirm schema version

## Redis

- Cache/queues are ephemeral — flush acceptable for rollback
- `FLUSHDB` only in emergency with approval

## Mobile

- Cannot rollback users already on new binary
- Force minimum API version via backend if breaking change shipped

## Queue recovery

1. Drain stuck jobs from BullMQ dashboard / Redis CLI
2. Replay DLQ after fix deployed
3. Re-enqueue critical notifications manually via admin test endpoint
