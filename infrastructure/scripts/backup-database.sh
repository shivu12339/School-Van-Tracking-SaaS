#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DIRECT_DATABASE_URL:-}" ]]; then
  echo "Set DIRECT_DATABASE_URL"
  exit 1
fi

STAMP=$(date +%Y%m%d_%H%M%S)
OUT="backup_${STAMP}.sql"

pg_dump "$DIRECT_DATABASE_URL" --no-owner --no-acl -f "$OUT"
echo "Backup written: $OUT"
echo "Supabase Pro includes daily backups — use this for ad-hoc exports."
