import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').required(),
  API_PORT: Joi.number().default(4000),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('v1'),
  THROTTLE_TTL_MS: Joi.number().default(60_000),
  THROTTLE_LIMIT: Joi.number().default(120),
  REDIS_MAX_RETRIES: Joi.number().default(3),
  REDIS_CONNECT_TIMEOUT_MS: Joi.number().default(10_000),
  CORS_ORIGINS: Joi.string().required(),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  REDIS_URL: Joi.string().uri({ scheme: [/rediss?/] }).required(),
  PROCESS_ROLE: Joi.string().valid('api', 'worker', 'all').default('all'),
  DIRECT_DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .optional()
    .allow(''),
  SENTRY_DSN: Joi.string().uri().optional().allow(''),
  SENTRY_ENVIRONMENT: Joi.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).optional(),
  CLOUDINARY_CLOUD_NAME: Joi.string().optional().allow(''),
  CLOUDINARY_API_KEY: Joi.string().optional().allow(''),
  CLOUDINARY_API_SECRET: Joi.string().optional().allow(''),
  CLOUDINARY_FOLDER: Joi.string().optional(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().required(),
  JWT_REFRESH_TTL: Joi.string().required(),
  AUTH_MAX_LOGIN_ATTEMPTS: Joi.number().default(5),
  AUTH_LOCK_DURATION_MINUTES: Joi.number().default(15),
  AUTH_LOCK_WINDOW_SECONDS: Joi.number().default(900),
  AUTH_PASSWORD_RESET_TTL_MINUTES: Joi.number().default(30),
  AUTH_SESSION_CACHE_TTL_SECONDS: Joi.number().default(900),
  AUTH_PERMISSIONS_CACHE_TTL_SECONDS: Joi.number().default(300),
  AUTH_USE_SECURE_COOKIES: Joi.boolean().default(true),
  SAAS_DEFAULT_TRIAL_DAYS: Joi.number().default(14),
  SAAS_DEFAULT_GRACE_PERIOD_DAYS: Joi.number().default(7),
  SAAS_ANALYTICS_CACHE_TTL_SECONDS: Joi.number().default(60),
  SAAS_PLATFORM_ANALYTICS_CACHE_TTL_SECONDS: Joi.number().default(120),
  SAAS_ENFORCE_SUBSCRIPTION: Joi.string().valid('true', 'false').default('true'),
  FCM_PROJECT_ID: Joi.string().required(),
  FCM_CLIENT_EMAIL: Joi.string().email().required(),
  FCM_PRIVATE_KEY: Joi.string().required(),
  GOOGLE_MAPS_API_KEY: Joi.string().required(),
});
