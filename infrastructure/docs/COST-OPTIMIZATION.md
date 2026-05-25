# Cost Optimization (MVP)

## Estimated monthly (free/low tier)

| Service | Tier | ~Cost |
|---------|------|-------|
| Vercel | Hobby | $0 |
| Railway | Hobby / usage | $0–5 |
| Supabase | Free | $0 |
| Upstash | Free | $0 |
| Cloudinary | Free | $0 |
| Firebase | Spark | $0 |
| Sentry | Developer | $0 |
| Google Maps | $200 credit | $0 early |

## Optimizations

### Railway

- Single API replica for MVP.
- Separate worker prevents API CPU starvation from BullMQ.
- Disable sleep with uptime ping only if needed.

### Database

- Connection pooler mandatory.
- Index foreign keys + geo columns.
- Archive completed trips > 90 days (future job).

### Redis

- TTL on all cache keys.
- Batch geofence evaluations.
- Limit BullMQ concurrency on free tier.

### Notifications

- Dedup geofence alerts (already implemented).
- Batch school broadcasts.

### Frontend

- Vercel image optimization for admin assets.
- Static generation where possible.

## When to upgrade

| Signal | Action |
|--------|--------|
| >50 concurrent live trips | 2nd API instance + confirm Redis adapter |
| DB >400MB | Supabase Pro |
| Redis command limit | Upstash pay-as-you-go |
| Railway sleep issues | Pro plan or AWS migration |
