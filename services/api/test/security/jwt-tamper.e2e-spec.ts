import request from 'supertest';
import { type INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/test-app.factory';

describe('Security — JWT tampering (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const tampered =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJyb2xlIjoiU1VQRVJfQURNSU4ifQ.invalid';

  it('rejects tampered bearer on /auth/me', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tampered}`);
    expect(res.status).toBe(401);
  });

  it('rejects malformed Authorization header', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'NotBearer token');
    expect(res.status).toBe(401);
  });

  it('rejects refresh with garbage token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'not-a-valid-refresh-token' });
    expect([400, 401]).toContain(res.status);
  });
});
