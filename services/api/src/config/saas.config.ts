import { registerAs } from '@nestjs/config';

export default registerAs('saas', () => ({
  defaultTrialDays: Number(process.env.SAAS_DEFAULT_TRIAL_DAYS ?? 14),
  defaultGracePeriodDays: Number(process.env.SAAS_DEFAULT_GRACE_PERIOD_DAYS ?? 7),
  analyticsCacheTtlSeconds: Number(process.env.SAAS_ANALYTICS_CACHE_TTL_SECONDS ?? 60),
  platformAnalyticsCacheTtlSeconds: Number(
    process.env.SAAS_PLATFORM_ANALYTICS_CACHE_TTL_SECONDS ?? 120,
  ),
  enforceSubscriptionOnWrite: process.env.SAAS_ENFORCE_SUBSCRIPTION !== 'false',
}));
