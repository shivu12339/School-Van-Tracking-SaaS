import request from 'supertest';
import { type INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/test-app.factory';

describe('Tracking — public guards (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects GPS push without auth', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/tracking/location')
      .send({
        tripId: '00000000-0000-0000-0000-000000000001',
        latitude: 12.97,
        longitude: 77.59,
        speed: 10,
        heading: 0,
        timestamp: new Date().toISOString(),
      });
    expect(res.status).toBe(401);
  });

  it('rejects trip start without auth', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/tracking/trips/start')
      .send({ tripId: '00000000-0000-0000-0000-000000000001' });
    expect(res.status).toBe(401);
  });
});
