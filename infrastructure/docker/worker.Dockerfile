# BullMQ worker image — build from services/api:
# docker build -f infrastructure/docker/worker.Dockerfile -t schoolvan-worker services/api

FROM node:22-alpine AS base
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN pnpm install

FROM deps AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
COPY prisma ./prisma
RUN pnpm prisma generate
RUN pnpm build

FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl libc6-compat
RUN addgroup -S app && adduser -S app -G app
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
ENV PROCESS_ROLE=worker
ENV API_PORT=4001

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json ./

USER app
EXPOSE 4001
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-4001}/api/v1/health/ready || exit 1

CMD ["node", "dist/worker.main.js"]
