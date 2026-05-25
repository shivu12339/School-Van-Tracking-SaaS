import request from 'supertest';
import { type INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/test-app.factory';

describe('Security — injection & validation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects SQL-like strings in login email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: "' OR '1'='1",
        password: 'x',
        schoolCode: 'X',
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects oversized JSON body on login', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'a@b.com',
        password: 'x'.repeat(20_000),
        schoolCode: 'SVT',
      });
    expect([400, 413, 422]).toContain(res.status);
  });

  it('does not expose stack traces on 404', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/not-a-real-route-xyz');
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/at\s+.*\.ts:\d+/);
  });
});
