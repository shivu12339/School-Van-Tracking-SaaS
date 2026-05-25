#!/usr/bin/env node
/**
 * Generates Railway-ready environment variables for the School Van API.
 * Produces fresh JWT secrets and prints a copy-pasteable block.
 *
 * Usage:
 *   node infrastructure/scripts/generate-railway-env.mjs
 *   node infrastructure/scripts/generate-railway-env.mjs --json
 *   node infrastructure/scripts/generate-railway-env.mjs --raw  # newline-separated KEY=VALUE
 */
import { randomBytes } from 'node:crypto';

const flag = process.argv.find((a) => a.startsWith('--')) ?? '';

function secret(bytes = 48) {
  return randomBytes(bytes).toString('base64url');
}

const env = {
  NODE_ENV: 'production',
  PROCESS_ROLE: 'api',
  API_PREFIX: 'api',
  API_VERSION: 'v1',

  DATABASE_URL:
    'postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10',
  DIRECT_DATABASE_URL:
    'postgresql://postgres.[REF]:[PASSWORD]@db.[REF].supabase.co:5432/postgres',
  REDIS_URL: 'rediss://default:[PASSWORD]@[NAME].upstash.io:6379',

  CORS_ORIGINS: 'https://your-app.vercel.app,http://localhost:3000',
  FRONTEND_URL: 'https://your-app.vercel.app',
  WEB_APP_URL: 'https://your-app.vercel.app',

  JWT_ACCESS_SECRET: secret(),
  JWT_REFRESH_SECRET: secret(),
  JWT_ACCESS_TTL: '900s',
  JWT_REFRESH_TTL: '30d',

  // Placeholders that pass Joi validation but disable the feature at runtime
  FCM_PROJECT_ID: 'placeholder-project',
  FCM_CLIENT_EMAIL: 'firebase-adminsdk@your-project.iam.gserviceaccount.com',
  FCM_PRIVATE_KEY: 'placeholder-key',
  GOOGLE_MAPS_API_KEY: 'placeholder-key',

  // Optional
  LOG_LEVEL: 'info',
  WRITE_LOG_FILES: 'true',
  SKIP_PRISMA_MIGRATE: 'false',
  SENTRY_ENVIRONMENT: 'production',
  SENTRY_TRACES_SAMPLE_RATE: '0.1',
  CLOUDINARY_FOLDER: 'schoolvan/production',
};

if (flag === '--json') {
  console.log(JSON.stringify(env, null, 2));
} else if (flag === '--raw') {
  for (const [k, v] of Object.entries(env)) console.log(`${k}=${v}`);
} else {
  console.log('# Paste into Railway -> Service -> Variables -> Raw Editor');
  console.log('# JWT secrets are freshly generated; replace bracketed values.');
  console.log('');
  for (const [k, v] of Object.entries(env)) console.log(`${k}=${v}`);
  console.log('');
  console.log('# Replace before going live:');
  console.log('#   DATABASE_URL / DIRECT_DATABASE_URL  -> Supabase connection strings');
  console.log('#   REDIS_URL                            -> Upstash rediss:// URL');
  console.log('#   CORS_ORIGINS / FRONTEND_URL          -> Vercel URL (after first web deploy)');
  console.log('#   FCM_* / GOOGLE_MAPS_API_KEY          -> real Firebase + Maps when ready');
}
