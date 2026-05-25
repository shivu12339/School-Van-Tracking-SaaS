#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"

echo "Liveness: $API_URL/api/v1/health"
curl -sf "$API_URL/api/v1/health" | head -c 200
echo ""

echo "Readiness: $API_URL/api/v1/health/ready"
curl -sf "$API_URL/api/v1/health/ready" | head -c 400
echo ""
