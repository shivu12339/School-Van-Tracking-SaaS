# Incident Response Runbook

## Severity levels

| SEV | Definition | Response |
|-----|------------|----------|
| SEV1 | Total outage / data breach | Immediate, all hands |
| SEV2 | Tracking down, notifications failing | <30 min |
| SEV3 | Degraded performance | <4 hours |
| SEV4 | Minor bug | Next business day |

## First 15 minutes

1. Acknowledge alert (Pager/UptimeRobot/Sentry)
2. Check `GET /api/v1/health/ready`
3. Check Railway/Vercel status pages
4. Check Supabase + Upstash dashboards
5. Post status in internal channel

## Common incidents

### API down

- Railway logs → OOM? migration failure?
- Rollback to previous deployment
- Verify `DATABASE_URL` / `REDIS_URL`

### WebSockets not updating

- Redis adapter connected? (boot log)
- Upstash quota exceeded?
- Scale API replicas — requires Redis adapter

### Queue backlog

- Worker service running?
- Inspect DLQ `notification-dlq`
- Scale worker replicas
- Pause geofence enqueue if flooding

### Database

- Connection pool exhausted → reduce concurrency
- Failover to Supabase read replica (if configured)
- Restore from backup — see [ROLLBACK.md](./ROLLBACK.md)

## Communication

- SEV1/2: notify school admins within 1 hour
- Post-mortem within 5 business days
