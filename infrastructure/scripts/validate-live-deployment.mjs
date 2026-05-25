#!/usr/bin/env node
/**
 * Cross-platform live deployment validator (Node 20+, no extra deps).
 *
 * Usage:
 *   API_URL=https://your-api.up.railway.app \
 *   WEB_URL=https://your-app.vercel.app \
 *   node infrastructure/scripts/validate-live-deployment.mjs
 *
 *   pnpm validate:live          # uses env vars, prints colour summary
 *   pnpm validate:live --json   # machine-readable JSON, exit 1 on failure
 *
 * Exit codes:
 *   0 - all required checks pass
 *   1 - at least one required check failed
 *   2 - missing API_URL
 */
import process from 'node:process';

const args = new Set(process.argv.slice(2));
const wantJson = args.has('--json');
const TIMEOUT_MS = Number(process.env.VALIDATE_TIMEOUT_MS ?? 15_000);

const API_URL = (process.env.API_URL ?? '').replace(/\/+$/, '');
const WEB_URL = (process.env.WEB_URL ?? '').replace(/\/+$/, '');

if (!API_URL) {
  console.error('API_URL is required.');
  console.error('  PowerShell : $env:API_URL = "https://YOUR-API.up.railway.app"');
  console.error('  bash       : export API_URL=https://YOUR-API.up.railway.app');
  process.exit(2);
}

const ANSI = process.stdout.isTTY && !wantJson;
const c = {
  reset: ANSI ? '\x1b[0m' : '',
  cyan: ANSI ? '\x1b[36m' : '',
  green: ANSI ? '\x1b[32m' : '',
  red: ANSI ? '\x1b[31m' : '',
  yellow: ANSI ? '\x1b[33m' : '',
  dim: ANSI ? '\x1b[2m' : '',
};

const results = []; // { step, label, status: 'pass'|'fail'|'warn', detail, required }

function log(line, color) {
  if (wantJson) return;
  if (color) process.stdout.write(`${color}${line}${c.reset}\n`);
  else process.stdout.write(`${line}\n`);
}

function section(title) {
  log('');
  log(`=== ${title} ===`, c.cyan);
}

async function fetchWithTimeout(url, init = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function check(label, fn, { required = true } = {}) {
  try {
    const detail = await fn();
    results.push({ label, status: 'pass', detail, required });
    log(`PASS  ${label}${detail ? ` ${c.dim}- ${detail}${c.reset}` : ''}`, c.green);
    return { ok: true, detail };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = required ? 'fail' : 'warn';
    results.push({ label, status, detail: message, required });
    log(`${required ? 'FAIL' : 'WARN'}  ${label} -> ${message}`, required ? c.red : c.yellow);
    return { ok: false, detail: message };
  }
}

function pickPayload(body) {
  if (body && typeof body === 'object' && 'data' in body) return body.data;
  return body;
}

async function readJson(url) {
  const resp = await fetchWithTimeout(url, { headers: { accept: 'application/json' } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

// 1) Root + healthchecks
section('Step 1 - Root + Healthchecks');

await check('GET /', async () => {
  const root = await readJson(`${API_URL}/`);
  if (!root?.service) throw new Error('missing service field');
  return `service=${root.service} status=${root.status}`;
});

await check('GET /api/v1/health', async () => {
  const body = await readJson(`${API_URL}/api/v1/health`);
  const p = pickPayload(body);
  return `status=${p?.status} role=${p?.role ?? 'n/a'} uptime=${p?.uptime ?? '?'}s`;
});

let readiness;
await check('GET /api/v1/health/ready', async () => {
  const body = await readJson(`${API_URL}/api/v1/health/ready`);
  readiness = pickPayload(body);
  const checks = readiness?.checks ?? {};
  const summary = Object.entries(checks)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
  for (const dep of ['database', 'redis']) {
    if (checks[dep] && checks[dep] !== 'ok') {
      throw new Error(`${dep} ${checks[dep]}`);
    }
  }
  return summary;
});

// 2) Swagger
section('Step 2 - API Docs');
await check(
  'GET /api/docs',
  async () => {
    const resp = await fetchWithTimeout(`${API_URL}/api/docs`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return `HTTP ${resp.status}`;
  },
  { required: false },
);

// 3) Auth guard
section('Step 3 - Auth Guard');
await check('GET /api/v1/auth/me returns 401', async () => {
  const resp = await fetchWithTimeout(`${API_URL}/api/v1/auth/me`);
  if (resp.status !== 401 && resp.status !== 403) {
    throw new Error(`expected 401/403, got ${resp.status}`);
  }
  return `HTTP ${resp.status}`;
});

// 4) Socket.IO handshake
section('Step 4 - Socket.IO');
await check('Socket.IO handshake reachable', async () => {
  const url = `${API_URL}/socket.io/?EIO=4&transport=polling`;
  const resp = await fetchWithTimeout(url);
  if (resp.status === 404) {
    throw new Error('404 - enable WebSockets on Railway');
  }
  return `HTTP ${resp.status}`;
});

// 5) CORS + Vercel (optional)
if (WEB_URL) {
  section('Step 5 - CORS preflight');
  await check(`OPTIONS /api/v1/health from ${WEB_URL}`, async () => {
    const resp = await fetchWithTimeout(`${API_URL}/api/v1/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: WEB_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type',
      },
    });
    const allow = resp.headers.get('access-control-allow-origin');
    if (!allow) throw new Error('missing Access-Control-Allow-Origin');
    if (allow !== WEB_URL && allow !== '*') {
      throw new Error(`CORS origin mismatch (got ${allow})`);
    }
    return `Allow-Origin=${allow}`;
  });

  section('Step 6 - Vercel');
  await check(`GET ${WEB_URL}/login`, async () => {
    const resp = await fetchWithTimeout(`${WEB_URL}/login`);
    if (resp.status >= 400) throw new Error(`HTTP ${resp.status}`);
    return `HTTP ${resp.status}`;
  });
}

const failed = results.filter((r) => r.status === 'fail');
const warned = results.filter((r) => r.status === 'warn');

if (wantJson) {
  console.log(
    JSON.stringify(
      {
        api: API_URL,
        web: WEB_URL || null,
        readiness: readiness ?? null,
        results,
        passed: results.length - failed.length - warned.length,
        warned: warned.length,
        failed: failed.length,
        ok: failed.length === 0,
      },
      null,
      2,
    ),
  );
} else {
  section('Summary');
  log(
    `${failed.length === 0 ? 'All required checks PASSED' : 'Required checks FAILED'}`,
    failed.length === 0 ? c.green : c.red,
  );
  if (warned.length) {
    log(`Warnings: ${warned.map((w) => w.label).join(', ')}`, c.yellow);
  }
  if (failed.length) {
    failed.forEach((f) => log(`  - ${f.label} :: ${f.detail}`, c.red));
  }
}

process.exit(failed.length === 0 ? 0 : 1);
