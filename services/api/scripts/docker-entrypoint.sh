#!/bin/sh
set -e

echo "[entrypoint] node=$(node --version) role=${PROCESS_ROLE:-api} port=${PORT:-4000}"
echo "[entrypoint] DATABASE_URL set: $([ -n "${DATABASE_URL:-}" ] && echo yes || echo no)"
echo "[entrypoint] DIRECT_DATABASE_URL set: $([ -n "${DIRECT_DATABASE_URL:-}" ] && echo yes || echo no)"
echo "[entrypoint] REDIS_URL set: $([ -n "${REDIS_URL:-}" ] && echo yes || echo no)"

if [ "${SKIP_PRISMA_MIGRATE:-false}" != "true" ] && [ -n "${DIRECT_DATABASE_URL:-}" ]; then
  echo "[entrypoint] running prisma migrate deploy"
  # Don't let a slow migration block the entire deploy: if it doesn't complete
  # in 4 minutes, log and continue. Healthcheck will report a degraded DB until
  # someone runs migrations manually.
  if ! timeout 240 npx prisma migrate deploy; then
    echo "[entrypoint] WARN: prisma migrate deploy did not complete in 240s; continuing boot."
  fi
elif [ "${SKIP_PRISMA_MIGRATE:-false}" = "true" ]; then
  echo "[entrypoint] SKIP_PRISMA_MIGRATE=true - skipping migrations"
else
  echo "[entrypoint] DIRECT_DATABASE_URL unset - skipping migrations"
fi

echo "[entrypoint] starting node dist/main.js"
exec node dist/main.js
