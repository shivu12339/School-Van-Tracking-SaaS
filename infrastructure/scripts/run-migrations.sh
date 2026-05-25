#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/services/api"

export DATABASE_URL="${DIRECT_DATABASE_URL:-$DATABASE_URL}"

echo "Running Prisma migrations against direct connection..."
npx prisma migrate deploy
echo "Migrations complete."
