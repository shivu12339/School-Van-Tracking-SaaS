import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Deployment health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toBeGreaterThan(0);
  });

  it('GET /api/v1/health/ready returns checks', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);
    expect(res.body.checks).toBeDefined();
    expect(res.body.checks.api).toBe('ok');
  });
});
