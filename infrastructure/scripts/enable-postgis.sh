#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DIRECT_DATABASE_URL:-}" ]]; then
  echo "Set DIRECT_DATABASE_URL to Supabase direct connection string"
  exit 1
fi

psql "$DIRECT_DATABASE_URL" -f "$(dirname "$0")/enable-postgis.sql"
echo "PostGIS enabled."
