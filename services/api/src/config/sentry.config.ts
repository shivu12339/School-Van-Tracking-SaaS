import { registerAs } from '@nestjs/config';

export default registerAs('sentry', () => ({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
}));
