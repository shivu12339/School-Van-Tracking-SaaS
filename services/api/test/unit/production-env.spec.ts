import { validationSchema } from '../../src/config/validation.schema';

describe('production environment template', () => {
  const railwayEnv = {
    NODE_ENV: 'production',
    PROCESS_ROLE: 'api',
    API_PREFIX: 'api',
    API_VERSION: 'v1',
    DATABASE_URL:
      'postgresql://postgres.ref:pw@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10',
    DIRECT_DATABASE_URL:
      'postgresql://postgres.ref:pw@db.ref.supabase.co:5432/postgres',
    REDIS_URL: 'rediss://default:pw@example.upstash.io:6379',
    CORS_ORIGINS: 'https://your-app.vercel.app,http://localhost:3000',
    FRONTEND_URL: 'https://your-app.vercel.app',
    JWT_ACCESS_SECRET: 'a'.repeat(48),
    JWT_REFRESH_SECRET: 'b'.repeat(48),
    JWT_ACCESS_TTL: '900s',
    JWT_REFRESH_TTL: '30d',
    FCM_PROJECT_ID: 'placeholder-project',
    FCM_CLIENT_EMAIL: 'firebase-adminsdk@your-project.iam.gserviceaccount.com',
    FCM_PRIVATE_KEY: 'placeholder-key',
    GOOGLE_MAPS_API_KEY: 'placeholder-key',
  };

  // Mirrors @nestjs/config's defaults: allowUnknown so platform-injected
  // variables (PORT, RAILWAY_*, VERCEL_URL, ...) don't fail validation.
  const opts = { abortEarly: false, allowUnknown: true } as const;

  it('Joi accepts the Railway placeholder template', () => {
    const { error } = validationSchema.validate(railwayEnv, opts);
    expect(error).toBeUndefined();
  });

  it('rejects under-length JWT_ACCESS_SECRET', () => {
    const { error } = validationSchema.validate(
      { ...railwayEnv, JWT_ACCESS_SECRET: 'short' },
      opts,
    );
    expect(error).toBeDefined();
  });

  it('rejects non-TLS REDIS_URL when scheme is wrong', () => {
    const { error } = validationSchema.validate(
      { ...railwayEnv, REDIS_URL: 'http://broken' },
      opts,
    );
    expect(error).toBeDefined();
  });

  it('rejects malformed FCM_CLIENT_EMAIL', () => {
    const { error } = validationSchema.validate(
      { ...railwayEnv, FCM_CLIENT_EMAIL: 'not-an-email' },
      opts,
    );
    expect(error).toBeDefined();
  });
});
