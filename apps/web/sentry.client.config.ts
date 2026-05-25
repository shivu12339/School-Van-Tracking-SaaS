/**
 * Optional Sentry — install @sentry/nextjs and set NEXT_PUBLIC_SENTRY_DSN on Vercel.
 * Loaded via instrumentation / Next.js Sentry wizard when package is present.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  void import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
      tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });
  }).catch(() => {
    // @sentry/nextjs not installed in local dev
  });
}
