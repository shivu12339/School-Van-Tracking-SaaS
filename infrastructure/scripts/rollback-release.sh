#!/usr/bin/env bash
# Documented rollback helper — run manually after incident review.
set -euo pipefail

echo "School Van SaaS — Rollback checklist"
echo "1. Vercel: Deployments → Promote previous production build"
echo "2. Railway API: Service → Deployments → Rollback"
echo "3. Railway Worker: Service → Deployments → Rollback"
echo "4. Database: only restore Supabase backup if schema/data corruption (migrations are forward-only)"
echo "5. Verify: API_URL=... bash infrastructure/scripts/smoke-test.sh"
echo ""
echo "Optional: redeploy known-good git tag:"
echo "  git checkout <tag> && gh workflow run deploy-api.yml"
