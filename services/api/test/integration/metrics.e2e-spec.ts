import request from 'supertest';
import { type INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/test-app.factory';

describe('Metrics (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/metrics returns counter snapshot', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/metrics').expect(200);
    expect(res.body.counters).toBeDefined();
    expect(res.body.ts).toBeDefined();
  });
});
