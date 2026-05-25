import { configNamespaces } from '../../src/config';
import appConfig from '../../src/config/app.config';

describe('Backend foundation', () => {
  it('loads all config namespaces', () => {
    expect(configNamespaces.length).toBeGreaterThanOrEqual(8);
  });

  it('validates app config shape', () => {
    process.env.CORS_ORIGINS = 'http://localhost:3000';
    process.env.API_PORT = '4000';
    const app = appConfig();
    expect(app.port).toBe(4000);
    expect(app.prefix).toBe('api');
    expect(app.corsOrigins.length).toBeGreaterThan(0);
  });
});
