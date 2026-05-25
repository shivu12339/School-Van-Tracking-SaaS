#!/usr/bin/env bash
# Post-deploy smoke tests — API_URL without trailing slash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
BASE="$API_URL/api/v1"

echo "=== Smoke: OpenAPI / health ==="
curl -sf "$BASE/health" | grep -q '"status"' || { echo "Liveness failed"; exit 1; }

READY=$(curl -sf "$BASE/health/ready")
echo "$READY"
echo "$READY" | grep -q '"database":"ok"' || { echo "Database check failed"; exit 1; }
echo "$READY" | grep -q '"redis":"ok"' || { echo "Redis check failed"; exit 1; }

echo "=== Smoke: Auth guard (expect 401) ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/me")
if [ "$STATUS" != "401" ] && [ "$STATUS" != "403" ]; then
  echo "Expected 401/403 on /auth/me without token, got $STATUS"
  exit 1
fi

echo "=== Smoke: WebSocket endpoint reachable ==="
# Socket.IO handshake — should not 404
WS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$API_URL/socket.io/?EIO=4&transport=polling" || true)
if [ "$WS_STATUS" = "404" ]; then
  echo "Socket.IO handshake returned 404 — enable WebSockets on Railway"
  exit 1
fi
echo "Socket.IO handshake HTTP $WS_STATUS (expected 200 or 400)"

echo "=== Smoke: PASS ==="
