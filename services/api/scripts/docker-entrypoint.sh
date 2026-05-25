#!/bin/sh
set -e

if [ "${SKIP_PRISMA_MIGRATE:-false}" != "true" ] && [ -n "${DIRECT_DATABASE_URL:-}" ]; then
  echo "[entrypoint] prisma migrate deploy"
  npx prisma migrate deploy
elif [ "${SKIP_PRISMA_MIGRATE:-false}" = "true" ]; then
  echo "[entrypoint] SKIP_PRISMA_MIGRATE=true — skipping migrations"
else
  echo "[entrypoint] DIRECT_DATABASE_URL unset — skipping migrations"
fi

exec node dist/main.js
