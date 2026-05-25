# Queue recovery runbook

## Symptoms

- Push notifications not delivered
- `queue_failed` elevated on `/api/v1/health/ready`
- BullMQ jobs stuck in `failed` or DLQ growing

## Diagnosis

1. Check worker service logs on Railway (`PROCESS_ROLE=worker`).
2. Verify `REDIS_URL` (Upstash) reachable from worker.
3. Admin API: `GET /api/v1/notifications/failed` (permission required).
4. Redis CLI: inspect `bull:push-notifications:*` keys.

## Recovery steps

1. **Restart worker** — Railway → Worker → Redeploy.
2. **Retry failed** — `POST /api/v1/notifications/retry` with `notificationId`.
3. **Purge poison message** — identify job payload in DLQ `notification-dlq`, fix data, delete key if needed.
4. **Scale worker** — increase replicas if backlog > 1000 jobs.

## Prevention

- Monitor DLQ depth weekly
- FCM credential rotation without downtime (update env, redeploy worker first)

## Escalation

If Redis unavailable > 5 min → follow [REDIS-RECOVERY.md](./REDIS-RECOVERY.md).
