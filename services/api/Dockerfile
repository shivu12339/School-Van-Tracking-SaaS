# NestJS API — pnpm workspace monorepo Docker build.
# Build context = repo root (NOT services/api).
#
#   docker build -f services/api/Dockerfile -t schoolvan-api .
#   docker run --rm -p 4000:4000 \
#     -e DATABASE_URL=... -e DIRECT_DATABASE_URL=... -e REDIS_URL=... \
#     -e JWT_ACCESS_SECRET=... -e JWT_REFRESH_SECRET=... \
#     -e JWT_ACCESS_TTL=900s -e JWT_REFRESH_TTL=30d \
#     -e CORS_ORIGINS=http://localhost:3000 \
#     -e FCM_PROJECT_ID=replace -e FCM_CLIENT_EMAIL=replace -e FCM_PRIVATE_KEY=replace \
#     -e GOOGLE_MAPS_API_KEY=replace \
#     schoolvan-api
#
# Railway: rootDirectory = "" (repo root), dockerfilePath = "services/api/Dockerfile".

############################################
# Base image — Node 22 + pnpm + native build deps
############################################
FROM node:22-alpine AS base
RUN apk add --no-cache openssl libc6-compat wget python3 make g++
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
ENV CI=true \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
WORKDIR /repo

############################################
# Stage 1 — install workspace dependencies
############################################
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY services/api/package.json ./services/api/
RUN pnpm install --frozen-lockfile

############################################
# Stage 2 — build shared + Prisma + API
############################################
FROM deps AS build
COPY tsconfig.base.json turbo.json ./
COPY packages/config ./packages/config
COPY packages/shared ./packages/shared
COPY services/api ./services/api

RUN pnpm --filter @schoolvan/shared run build
RUN pnpm --filter @schoolvan/api exec prisma generate
RUN pnpm --filter @schoolvan/api run build

############################################
# Stage 3 — pnpm deploy → flat self-contained API
############################################
FROM build AS deploy
RUN pnpm --filter=@schoolvan/api --legacy deploy /out
WORKDIR /out
RUN ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma

############################################
# Stage 4 — minimal runtime image
############################################
FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl libc6-compat wget
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

ENV NODE_ENV=production \
    PROCESS_ROLE=api \
    PORT=4000

COPY --from=deploy --chown=app:app /out/node_modules ./node_modules
COPY --from=deploy --chown=app:app /out/dist ./dist
COPY --from=deploy --chown=app:app /out/prisma ./prisma
COPY --from=deploy --chown=app:app /out/scripts ./scripts
COPY --from=deploy --chown=app:app /out/package.json ./package.json

# Winston writes logs/{error,combined}.log at runtime — pre-create the dir
# and ensure the non-root `app` user owns the entire workdir so it can be
# written without EACCES.
RUN mkdir -p /app/logs \
  && chmod +x ./scripts/docker-entrypoint.sh \
  && chown -R app:app /app

USER app
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-4000}/api/v1/health/ready" || exit 1

CMD ["sh", "./scripts/docker-entrypoint.sh"]
