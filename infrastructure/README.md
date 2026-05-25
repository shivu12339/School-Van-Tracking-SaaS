# School Van SaaS — MVP Deployment (Step 12)

Production-grade, **free-tier optimized** deployment with a clear path to **AWS**.

## Architecture

```
Flutter (Driver / Parent)
        │
        ▼
┌───────────────────┐
│  Vercel (Next.js) │  Admin + Super Admin dashboards
└─────────┬─────────┘
          │ HTTPS  /api/backend proxy
          ▼
┌───────────────────┐     WebSocket (Socket.IO)
│  Railway (API)    │◄──────────────────────────── Mobile / Web clients
│  NestJS + Docker  │
└─────────┬─────────┘
          │
    ┌─────┴─────┬─────────────┐
    ▼           ▼             ▼
 Supabase    Upstash       Firebase
 PostgreSQL   Redis          FCM
 + PostGIS   BullMQ +
             Socket adapter
```

| Component | MVP provider | Future AWS |
|-----------|--------------|------------|
| Frontend | Vercel | CloudFront + S3 / Amplify |
| API | Railway (Docker) | ECS Fargate |
| Workers | Railway (Docker) | ECS (separate service) |
| Database | Supabase | RDS PostgreSQL + PostGIS |
| Cache/Queues | Upstash Redis | ElastiCache |
| Media | Cloudinary | S3 + CloudFront |
| Push | Firebase | Firebase (unchanged) |
| Maps | Google Maps Platform | Same |
| Errors | Sentry | Same |
| CI/CD | GitHub Actions | Same + CodePipeline optional |

## Quick start

1. **Supabase** — create project → run `scripts/enable-postgis.sql` → set `DATABASE_URL` + `DIRECT_DATABASE_URL`
2. **Upstash** — create Redis → copy `rediss://` URL
3. **Railway** — deploy `services/api` (API) + worker Dockerfile
4. **Vercel** — deploy `apps/web`
5. **Firebase** — service account → `FCM_*` env vars
6. **Secrets** — copy `infrastructure/env/.env.production.example`

## Folder map

| Path | Purpose |
|------|---------|
| [`docker/`](docker/) | Multi-stage API + Worker Dockerfiles |
| [`railway/`](railway/) | Railway config + guide |
| [`vercel/`](vercel/) | Vercel deployment guide |
| [`nginx/`](nginx/) | Future ALB / reverse proxy reference |
| [`scripts/`](scripts/) | PostGIS, migrations, backup, health |
| [`env/`](env/) | Environment templates per stage |
| [`github-actions/`](github-actions/) | CI/CD documentation |
| [`docs/`](docs/) | Deep-dive guides |

## Docs

- [MVP deployment runbook](docs/MVP-DEPLOYMENT.md)
- [Supabase + PostGIS](docs/SUPABASE.md)
- [Upstash Redis](docs/UPSTASH-REDIS.md)
- [WebSockets on Railway](docs/WEBSOCKETS.md)
- [Firebase production](docs/FIREBASE.md)
- [Cloudinary media](docs/CLOUDINARY.md)
- [Monitoring & Sentry](docs/MONITORING.md)
- [Backup & disaster recovery](docs/BACKUP-DR.md)
- [Cost optimization](docs/COST-OPTIMIZATION.md)
- [AWS migration plan](docs/AWS-MIGRATION.md)

## Health endpoints

- `GET /api/v1/health` — liveness (uptime, process role)
- `GET /api/v1/health/ready` — DB + Redis + BullMQ queue metrics (worker)

See also [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md).

## Process roles

| `PROCESS_ROLE` | Container |
|----------------|-----------|
| `api` | HTTP + Socket.IO (no inline BullMQ workers) |
| `worker` | BullMQ consumers only |
| `all` | Local dev — single process |

## Security checklist

- [ ] HTTPS on all public endpoints (Railway + Vercel automatic)
- [ ] `CORS_ORIGINS` restricted to admin domain
- [ ] JWT secrets ≥ 32 chars in secret manager
- [ ] Firebase + DB credentials only in platform env vars
- [ ] Maps API keys HTTP-referrer restricted
- [ ] Rate limiting enabled (NestJS Throttler)
