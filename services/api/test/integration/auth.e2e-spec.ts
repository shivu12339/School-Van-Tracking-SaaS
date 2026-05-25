import request from 'supertest';
import { type INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/test-app.factory';

describe('Auth (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects login without body', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/login').send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: 'not-a-real-user@schoolvan.app',
      password: 'WrongPassword!123',
      schoolCode: 'INVALID-CODE',
    });
    expect([401, 404]).toContain(res.status);
  });

  it('rejects protected route without token', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
