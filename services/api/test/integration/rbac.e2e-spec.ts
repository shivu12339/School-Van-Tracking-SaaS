import request from 'supertest';
import { type INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/test-app.factory';

describe('RBAC (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks unauthenticated access to schools list', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/schools');
    expect(res.status).toBe(401);
  });

  it('blocks unauthenticated access to notifications', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });

  it('blocks unauthenticated driver trips', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/driver/trips');
    expect(res.status).toBe(401);
  });
});
