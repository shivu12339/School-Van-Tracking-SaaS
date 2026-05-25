# DEPRECATED: prefer services/api/Dockerfile (monorepo root build context).
# Kept as a thin alias so legacy `docker build -f infrastructure/docker/api.Dockerfile .`
# still produces an identical image. Build context = repo root.

# syntax=docker/dockerfile:1.6
FROM scratch AS reference
# This file mirrors services/api/Dockerfile to avoid duplicate maintenance.
# Edit services/api/Dockerfile and copy changes here, OR delete this file
# and update CI to point at services/api/Dockerfile.

# To use the canonical Dockerfile:
#   docker build -f services/api/Dockerfile -t schoolvan-api .

# Re-include canonical pipeline below:
FROM node:22-alpine AS base
RUN apk add --no-cache openssl libc6-compat wget python3 make g++
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate
ENV CI=true
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY services/api/package.json ./services/api/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json turbo.json ./
COPY packages/config ./packages/config
COPY packages/shared ./packages/shared
COPY services/api ./services/api
RUN pnpm --filter @schoolvan/shared run build
RUN pnpm --filter @schoolvan/api exec prisma generate
RUN pnpm --filter @schoolvan/api run build

FROM build AS deploy
RUN pnpm --filter=@schoolvan/api --legacy deploy /out
WORKDIR /out
RUN ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma

FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl libc6-compat wget
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production PROCESS_ROLE=api PORT=4000

COPY --from=deploy --chown=app:app /out/node_modules ./node_modules
COPY --from=deploy --chown=app:app /out/dist ./dist
COPY --from=deploy --chown=app:app /out/prisma ./prisma
COPY --from=deploy --chown=app:app /out/scripts ./scripts
COPY --from=deploy --chown=app:app /out/package.json ./package.json
RUN mkdir -p /app/logs \
  && chmod +x ./scripts/docker-entrypoint.sh \
  && chown -R app:app /app

USER app
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-4000}/api/v1/health/ready" || exit 1

CMD ["sh", "./scripts/docker-entrypoint.sh"]
