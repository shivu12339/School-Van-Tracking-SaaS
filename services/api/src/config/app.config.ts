import { registerAs } from '@nestjs/config';

function resolveCorsOrigins(): string[] {
  const fromList = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const extras: string[] = [];
  const pushOrigin = (value?: string) => {
    if (!value?.trim()) return;
    const v = value.trim();
    extras.push(v.startsWith('http') ? v : `https://${v}`);
  };

  pushOrigin(process.env.FRONTEND_URL);
  pushOrigin(process.env.WEB_APP_URL);
  if (process.env.VERCEL_URL) {
    pushOrigin(process.env.VERCEL_URL);
    pushOrigin(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    pushOrigin(process.env.RAILWAY_PUBLIC_DOMAIN);
    pushOrigin(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  }

  return [...new Set([...fromList, ...extras])];
}

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? process.env.API_PORT ?? 4000),
  prefix: process.env.API_PREFIX ?? 'api',
  version: process.env.API_VERSION ?? 'v1',
  corsOrigins: resolveCorsOrigins(),
  processRole: process.env.PROCESS_ROLE ?? 'all',
  throttleTtl: Number(process.env.THROTTLE_TTL_MS ?? 60_000),
  throttleLimit: Number(process.env.THROTTLE_LIMIT ?? 120),
  bodyLimit: process.env.HTTP_BODY_LIMIT ?? '256kb',
}));
