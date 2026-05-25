#!/usr/bin/env node
/**
 * Ensures production env templates list all required keys.
 * Usage: node infrastructure/scripts/validate-production-env.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const requiredApi = [
  'NODE_ENV',
  'PROCESS_ROLE',
  'DATABASE_URL',
  'DIRECT_DATABASE_URL',
  'REDIS_URL',
  'CORS_ORIGINS',
  'FRONTEND_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_TTL',
  'JWT_REFRESH_TTL',
  'FCM_PROJECT_ID',
  'FCM_CLIENT_EMAIL',
  'FCM_PRIVATE_KEY',
  'GOOGLE_MAPS_API_KEY',
];

const requiredWeb = [
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_WS_BASE_URL',
  'API_INTERNAL_URL',
  'JWT_ACCESS_SECRET',
];

function parseKeys(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const keys = new Set();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) keys.add(trimmed.slice(0, eq).trim());
  }
  return keys;
}

function assertKeys(label, filePath, required) {
  const full = path.join(root, filePath);
  if (!fs.existsSync(full)) {
    console.error(`Missing ${label}: ${filePath}`);
    process.exit(1);
  }
  const keys = parseKeys(full);
  const missing = required.filter((k) => !keys.has(k));
  if (missing.length) {
    console.error(`${label} ${filePath} missing keys: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log(`OK ${label}: ${required.length} required keys present`);
}

assertKeys('API', 'services/api/.env.production.example', requiredApi);
assertKeys('Web', 'apps/web/.env.production.example', requiredWeb);
console.log('Production env templates validated.');
