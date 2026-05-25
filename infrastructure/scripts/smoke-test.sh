#!/usr/bin/env bash
# Post-deploy smoke tests - uses curl, runs anywhere bash is available
# (Linux, macOS, Git Bash on Windows, GitHub Actions, Railway shell, Vercel CI).
#
# Usage:
#   API_URL=https://your-api.up.railway.app \
#     SMOKE_EMAIL=admin@example.com \
#     SMOKE_PASSWORD=secret \
#     bash infrastructure/scripts/smoke-test.sh
#
# All variables except API_URL are optional. Auth check is skipped if either
# SMOKE_EMAIL or SMOKE_PASSWORD is unset.
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
API_URL="${API_URL%/}"
BASE="$API_URL/api/v1"

PASS=0
FAIL=0

ok() { echo "PASS  $1"; PASS=$((PASS+1)); }
ng() { echo "FAIL  $1 -- $2" >&2; FAIL=$((FAIL+1)); }

curl_status() {
  curl -sS -o /dev/null -w "%{http_code}" --max-time 30 "$@"
}

curl_body() {
  curl -sS --max-time 30 -H 'accept: application/json' "$@"
}

echo "=== Smoke target: $API_URL ==="

# 1) Liveness
HEALTH=$(curl_body "$BASE/health" || true)
echo "$HEALTH" | grep -q '"status"' \
  && ok "GET /api/v1/health" \
  || ng "GET /api/v1/health" "$HEALTH"

# 2) Readiness (DB, Redis, queues if present)
READY=$(curl_body "$BASE/health/ready" || true)
if echo "$READY" | grep -q '"database":"ok"'; then ok "readiness database=ok"; else ng "readiness database" "$READY"; fi
if echo "$READY" | grep -q '"redis":"ok"';    then ok "readiness redis=ok";    else ng "readiness redis"    "$READY"; fi

if echo "$READY" | grep -q '"queues"'; then
  if echo "$READY" | grep -q '"queues":"ok"'; then
    ok "readiness queues=ok"
  else
    ng "readiness queues" "$READY"
  fi
else
  echo "SKIP  queues check (worker role probably not running on this URL)"
fi

# 3) Swagger
DOCS_STATUS=$(curl_status "$API_URL/api/docs" || true)
case "$DOCS_STATUS" in
  200|301|302|404) ok "GET /api/docs (HTTP $DOCS_STATUS)";;
  *) ng "GET /api/docs" "HTTP $DOCS_STATUS";;
esac

# 4) Auth guard - protected route must reject anonymous request
AUTH_STATUS=$(curl_status "$BASE/auth/me" || true)
case "$AUTH_STATUS" in
  401|403) ok "auth guard (HTTP $AUTH_STATUS)";;
  *) ng "auth guard" "expected 401/403 on /auth/me, got $AUTH_STATUS";;
esac

# 5) Auth login (only if credentials provided)
if [ -n "${SMOKE_EMAIL:-}" ] && [ -n "${SMOKE_PASSWORD:-}" ]; then
  LOGIN_STATUS=$(curl -sS -o /tmp/smoke-login.json -w "%{http_code}" --max-time 30 \
    -H 'content-type: application/json' \
    -X POST "$BASE/auth/login" \
    -d "{\"email\":\"$SMOKE_EMAIL\",\"password\":\"$SMOKE_PASSWORD\"}" || true)
  if [ "$LOGIN_STATUS" = "200" ] || [ "$LOGIN_STATUS" = "201" ]; then
    if grep -q 'accessToken' /tmp/smoke-login.json 2>/dev/null; then
      ok "auth login -> accessToken issued"
    else
      ng "auth login" "HTTP $LOGIN_STATUS but no accessToken in body"
    fi
  else
    ng "auth login" "HTTP $LOGIN_STATUS"
  fi
  rm -f /tmp/smoke-login.json
else
  echo "SKIP  auth login (set SMOKE_EMAIL and SMOKE_PASSWORD to enable)"
fi

# 6) Socket.IO handshake
WS_STATUS=$(curl_status "$API_URL/socket.io/?EIO=4&transport=polling" || true)
case "$WS_STATUS" in
  200|400) ok "Socket.IO handshake (HTTP $WS_STATUS)";;
  404)     ng "Socket.IO handshake" "404 - enable WebSockets on Railway / Settings / Networking";;
  *)       ng "Socket.IO handshake" "HTTP $WS_STATUS";;
esac

echo ""
echo "=== Smoke result: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ]
