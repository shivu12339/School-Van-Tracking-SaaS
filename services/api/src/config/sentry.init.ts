/**
 * Sentry — enabled when SENTRY_DSN is set (Railway / production).
 */
import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || initialized) return;

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
  });
  initialized = true;
}

export { Sentry };
