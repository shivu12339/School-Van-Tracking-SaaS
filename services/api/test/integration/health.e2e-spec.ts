import request from 'supertest';
import { type INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/test-app.factory';

describe('Health (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/schoolvan_test?schema=public';
    process.env.DIRECT_DATABASE_URL = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
    process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data?.status ?? res.body.status).toBe('ok');
  });

  it('GET /api/v1/health/ready checks dependencies', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health/ready');
    expect(res.status).toBe(200);
    const body = res.body.data ?? res.body;
    expect(body.checks).toBeDefined();
  });
});
