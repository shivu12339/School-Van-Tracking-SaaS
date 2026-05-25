# AWS Migration Strategy

Architecture is **provider-agnostic** — migration is primarily infrastructure, not application rewrites.

## Mapping

| MVP | AWS target |
|-----|------------|
| Railway API | **ECS Fargate** service (ALB + target group) |
| Railway Worker | ECS service (no ALB, scale on queue depth) |
| Vercel | **CloudFront** + S3 (static) or Amplify Hosting |
| Supabase | **RDS PostgreSQL 16** + PostGIS |
| Upstash | **ElastiCache Redis** (cluster mode optional) |
| Cloudinary | **S3** + **CloudFront** signed URLs |
| Firebase | Unchanged |
| GitHub Actions | Same (deploy to ECS via OIDC) |

## Migration phases

### Phase A — Parallel staging on AWS

1. Terraform/CDK in `infra/aws/` (future).
2. RDS from Supabase dump restore.
3. ElastiCache + same env var names.
4. ECS tasks use existing Dockerfiles.

### Phase B — Cutover

1. DNS `api.yourdomain.com` → ALB.
2. `admin.yourdomain.com` → CloudFront.
3. Drain Railway connections (maintenance window).

### Phase C — Decommission MVP hosts

## Minimal code changes

| Component | Change |
|-----------|--------|
| `DATABASE_URL` | RDS endpoint |
| `REDIS_URL` | ElastiCache endpoint |
| `MediaService` | S3 implementation |
| SSL pinning | Enable in mobile prod builds |
| Secrets | AWS Secrets Manager vs Railway vars |

## Infrastructure abstraction

- **12-factor env vars** — no provider SDKs in domain layer.
- **Docker images** — portable to ECS unchanged.
- **Prisma** — standard PostgreSQL.
- **Socket.IO** — Redis adapter works on ElastiCache.

## NGINX / ALB

Use `infrastructure/nginx/nginx.conf` as ALB target group reference:

- HTTP → ECS tasks
- WebSocket upgrade on `/socket.io/`
- Health check → `/api/v1/health/ready`

## ECS task definition (outline)

```yaml
# api-service: 512 CPU, 1024 MB, PORT from env
# worker-service: 256 CPU, 512 MB
# secrets from Secrets Manager
# execute command enabled for debugging
```

## CI/CD on AWS

Replace Railway webhook with:

```
GitHub Actions → ECR push → ECS deploy → prisma migrate (CodeBuild step)
```

## Rollback

- ECS circuit breaker + previous task definition revision.
- RDS snapshot before major migrations.

## Timeline estimate

| Team size | Duration |
|-----------|----------|
| 1 DevOps + 1 backend | 2–3 weeks staging, 1 day cutover |
