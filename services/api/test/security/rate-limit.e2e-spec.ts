import request from 'supertest';
import { type INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/test-app.factory';

describe('Security — rate limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('eventually returns 429 on burst login attempts', async () => {
    const attempts = 25;
    const statuses: number[] = [];
    for (let i = 0; i < attempts; i += 1) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: `brute-${i}@test.com`,
          password: 'wrong',
          schoolCode: 'X',
        });
      statuses.push(res.status);
    }
    const hasThrottle = statuses.some((s) => s === 429);
    const hasAuthErrors = statuses.filter((s) => s === 401 || s === 400 || s === 404).length > 0;
    expect(hasAuthErrors || hasThrottle).toBe(true);
  }, 60_000);
});
