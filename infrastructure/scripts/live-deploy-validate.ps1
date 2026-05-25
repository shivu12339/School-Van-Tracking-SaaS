# Live Railway / Vercel deployment validator.
# Usage:
#   $env:API_URL = "https://your-api.up.railway.app"
#   $env:WEB_URL = "https://your-app.vercel.app"   # optional
#   pwsh infrastructure/scripts/live-deploy-validate.ps1
#
# Exit code 0 = all required checks pass; non-zero = at least one failure.

[CmdletBinding()]
param(
  [string]$ApiUrl = $env:API_URL,
  [string]$WebUrl = $env:WEB_URL,
  [int]$TimeoutSec = 30
)

$ErrorActionPreference = "Continue"
$failures = @()
$warnings = @()

function Section($title) {
  Write-Host ""
  Write-Host "=== $title ===" -ForegroundColor Cyan
}

function Check([string]$label, [scriptblock]$action, [bool]$required = $true) {
  try {
    $result = & $action
    Write-Host "PASS  $label" -ForegroundColor Green
    return $result
  } catch {
    $msg = $_.Exception.Message -replace "\s+", " "
    if ($required) {
      Write-Host "FAIL  $label -> $msg" -ForegroundColor Red
      $script:failures += $label
    } else {
      Write-Host "WARN  $label -> $msg" -ForegroundColor Yellow
      $script:warnings += $label
    }
    return $null
  }
}

if (-not $ApiUrl) {
  Write-Host "API_URL not set. Set Railway public URL and re-run:" -ForegroundColor Yellow
  Write-Host '  $env:API_URL = "https://YOUR-API.up.railway.app"' -ForegroundColor Yellow
  exit 2
}

$ApiUrl = $ApiUrl.TrimEnd("/")
Write-Host "Target API: $ApiUrl" -ForegroundColor Cyan

# 1) Root route
Section "Step 1 - Root + Healthchecks"
$root = Check "GET /" {
  Invoke-RestMethod -Uri "$ApiUrl/" -TimeoutSec $TimeoutSec -Method Get
}
if ($root) { Write-Host "      service=$($root.service) status=$($root.status)" }

$health = Check "GET /api/v1/health" {
  Invoke-RestMethod -Uri "$ApiUrl/api/v1/health" -TimeoutSec $TimeoutSec -Method Get
}
if ($health) {
  $payload = if ($health.data) { $health.data } else { $health }
  Write-Host "      status=$($payload.status) role=$($payload.role) uptime=$($payload.uptime)s"
}

$ready = Check "GET /api/v1/health/ready" {
  Invoke-RestMethod -Uri "$ApiUrl/api/v1/health/ready" -TimeoutSec $TimeoutSec -Method Get
}
if ($ready) {
  $payload = if ($ready.data) { $ready.data } else { $ready }
  Write-Host "      status=$($payload.status)"
  $checks = $payload.checks
  if ($checks) {
    foreach ($prop in $checks.PSObject.Properties) {
      $color = if ($prop.Value -eq "ok") { "Green" } elseif ($prop.Value -eq "degraded") { "Yellow" } else { "Red" }
      Write-Host ("      {0,-18} {1}" -f $prop.Name, $prop.Value) -ForegroundColor $color
      if ($prop.Name -in @("database","redis") -and $prop.Value -ne "ok") {
        $failures += "$($prop.Name) check"
      }
    }
  }
}

# 2) Swagger (only in non-production)
Section "Step 2 - API Docs"
Check "GET /api/docs" {
  $resp = Invoke-WebRequest -Uri "$ApiUrl/api/docs" -UseBasicParsing -TimeoutSec $TimeoutSec
  if ($resp.StatusCode -ne 200) { throw "HTTP $($resp.StatusCode)" }
} $false | Out-Null

# 3) Auth guard expected on protected route
Section "Step 3 - Auth Guard"
Check "GET /api/v1/auth/me returns 401" {
  try {
    Invoke-WebRequest -Uri "$ApiUrl/api/v1/auth/me" -UseBasicParsing -TimeoutSec $TimeoutSec -ErrorAction Stop | Out-Null
    throw "expected 401, got 2xx"
  } catch {
    $resp = $_.Exception.Response
    if (-not $resp) { throw $_.Exception.Message }
    $code = [int]$resp.StatusCode
    if ($code -ne 401 -and $code -ne 403) { throw "expected 401/403, got $code" }
  }
} | Out-Null

# 4) Socket.IO handshake
Section "Step 4 - Socket.IO"
Check "Socket.IO handshake reachable" {
  $socketUrl = $ApiUrl + '/socket.io/?EIO=4' + '&' + 'transport=polling'
  $resp = Invoke-WebRequest -Uri $socketUrl -UseBasicParsing -TimeoutSec $TimeoutSec
  if ($resp.StatusCode -eq 404) { throw 'Socket.IO 404 - enable WebSockets on Railway' }
  Write-Host "      handshake HTTP $($resp.StatusCode)"
} | Out-Null

# 5) CORS preflight from configured Vercel origin
if ($WebUrl) {
  Section "Step 5 - CORS preflight"
  $WebUrl = $WebUrl.TrimEnd("/")
  Check "OPTIONS /api/v1/health from $WebUrl" {
    $resp = Invoke-WebRequest `
      -Uri "$ApiUrl/api/v1/health" `
      -Method Options `
      -Headers @{
        "Origin" = $WebUrl
        "Access-Control-Request-Method" = "GET"
        "Access-Control-Request-Headers" = "authorization,content-type"
      } `
      -UseBasicParsing -TimeoutSec $TimeoutSec
    $allow = $resp.Headers["Access-Control-Allow-Origin"]
    if (-not $allow) { throw "missing Access-Control-Allow-Origin" }
    Write-Host "      Access-Control-Allow-Origin: $allow"
    if ($allow -ne $WebUrl -and $allow -ne "*") {
      throw "CORS origin mismatch (expected $WebUrl)"
    }
  } | Out-Null

  Section "Step 6 - Vercel"
  Check "GET $WebUrl/login" {
    $resp = Invoke-WebRequest -Uri "$WebUrl/login" -UseBasicParsing -TimeoutSec $TimeoutSec
    if ($resp.StatusCode -ge 400) { throw "HTTP $($resp.StatusCode)" }
  } | Out-Null
}

Section "Summary"
if ($failures.Count -eq 0) {
  Write-Host "All required checks PASSED" -ForegroundColor Green
  if ($warnings.Count -gt 0) {
    Write-Host "Warnings: $($warnings -join ', ')" -ForegroundColor Yellow
  }
  exit 0
} else {
  Write-Host "Required checks FAILED:" -ForegroundColor Red
  $failures | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
  exit 1
}
