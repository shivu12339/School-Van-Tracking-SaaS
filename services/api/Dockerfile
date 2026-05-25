# Default API Dockerfile (Railway). Build context: services/api
FROM node:22-alpine AS base
RUN apk add --no-cache openssl libc6-compat wget
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN pnpm install

FROM deps AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY scripts ./scripts
COPY src ./src
COPY prisma ./prisma
RUN pnpm prisma generate && pnpm run build

FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl libc6-compat wget
RUN addgroup -S app && adduser -S app -G app
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV PROCESS_ROLE=api

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json prisma ./
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x ./scripts/docker-entrypoint.sh

USER app
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-4000}/api/v1/health/ready" || exit 1

CMD ["sh", "./scripts/docker-entrypoint.sh"]
