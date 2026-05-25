# Live deployment validation — run after Railway + Vercel are deployed.
# Usage:
#   $env:API_URL = "https://your-api.up.railway.app"
#   $env:WEB_URL = "https://your-app.vercel.app"
#   pwsh infrastructure/scripts/live-deploy-validate.ps1

param(
  [string]$ApiUrl = $env:API_URL,
  [string]$WebUrl = $env:WEB_URL
)

$ErrorActionPreference = "Stop"

if (-not $ApiUrl) {
  Write-Host "Set API_URL (Railway public URL, no trailing slash)" -ForegroundColor Yellow
  exit 1
}

Write-Host "=== Railway API: $ApiUrl ===" -ForegroundColor Cyan

function Invoke-Api($path) {
  return Invoke-RestMethod -Uri "$ApiUrl$path" -TimeoutSec 30
}

try {
  $root = Invoke-Api "/"
  Write-Host "GET / -> $($root | ConvertTo-Json -Compress)"
} catch {
  Write-Host "FAIL GET / : $_" -ForegroundColor Red
}

try {
  $health = Invoke-Api "/api/v1/health"
  Write-Host "GET /api/v1/health -> status=$($health.status)"
} catch {
  Write-Host "FAIL health: $_" -ForegroundColor Red
}

try {
  $ready = Invoke-Api "/api/v1/health/ready"
  Write-Host "GET /api/v1/health/ready -> $($ready | ConvertTo-Json -Compress)"
  if ($ready.checks.database -ne "ok") { Write-Host "WARN database not ok" -ForegroundColor Yellow }
  if ($ready.checks.redis -ne "ok") { Write-Host "WARN redis not ok" -ForegroundColor Yellow }
} catch {
  Write-Host "FAIL ready: $_" -ForegroundColor Red
}

try {
  $sw = Invoke-WebRequest -Uri "$ApiUrl/api/docs" -UseBasicParsing -TimeoutSec 30
  if ($sw.StatusCode -eq 200) { Write-Host "GET /api/docs -> $($sw.StatusCode) (disabled in prod is OK if 404)" }
} catch {
  Write-Host "NOTE /api/docs: $_ (expected 404 when NODE_ENV=production)" -ForegroundColor DarkYellow
}

try {
  $sock = Invoke-WebRequest -Uri "$ApiUrl/socket.io/?EIO=4&transport=polling" -UseBasicParsing -TimeoutSec 30
  Write-Host "Socket.IO handshake -> HTTP $($sock.StatusCode)"
} catch {
  Write-Host "FAIL Socket.IO: $_" -ForegroundColor Red
}

if ($WebUrl) {
  Write-Host "`n=== Vercel Web: $WebUrl ===" -ForegroundColor Cyan
  try {
    $login = Invoke-WebRequest -Uri "$WebUrl/login" -UseBasicParsing -TimeoutSec 30
    Write-Host "GET /login -> $($login.StatusCode)"
  } catch {
    Write-Host "FAIL Vercel /login: $_" -ForegroundColor Red
  }
}

Write-Host "`nDone. For auth smoke run: API_URL=$ApiUrl bash infrastructure/scripts/smoke-test.sh" -ForegroundColor Green
