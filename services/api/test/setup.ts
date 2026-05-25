/** Global test setup — deterministic env for unit/integration runs. */
process.env.NODE_ENV = 'test';
process.env.PROCESS_ROLE = 'all';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_minimum_32_characters';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_minimum_32_characters';
process.env.JWT_ACCESS_TTL = '900';
process.env.JWT_REFRESH_TTL = '30d';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.FCM_PROJECT_ID = 'test';
process.env.FCM_CLIENT_EMAIL = 'test@schoolvan.app';
process.env.FCM_PRIVATE_KEY = 'test-key';
process.env.GOOGLE_MAPS_API_KEY = 'test-maps-key';

jest.setTimeout(30_000);
