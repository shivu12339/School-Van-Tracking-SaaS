import { Test } from '@nestjs/testing';
import { EtaService } from '../../src/tracking/services/eta.service';
import { RedisService } from '../../src/redis/redis.service';
import { createRedisServiceMock } from '../mocks/redis.mock';

describe('EtaService', () => {
  let service: EtaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [EtaService, { provide: RedisService, useValue: createRedisServiceMock() }],
    }).compile();
    service = module.get(EtaService);
  });

  it('calculates ETA for known distance', () => {
    const result = service.calculateEtaMinutes(12.97, 77.59, 12.98, 77.6);
    expect(result.distanceMeters).toBeGreaterThan(0);
    expect(result.etaMinutes).toBeGreaterThanOrEqual(1);
  });

  it('returns minimum 1 minute ETA', () => {
    const result = service.calculateEtaMinutes(12.97, 77.59, 12.97001, 77.59001);
    expect(result.etaMinutes).toBe(1);
  });

  it('caches and retrieves ETA payload', async () => {
    const payload = {
      tripId: 'trip-1',
      studentId: 'student-1',
      etaMinutes: 8,
      distanceMeters: 1200,
      updatedAt: new Date().toISOString(),
    };
    await service.cacheEta(payload);
    const cached = await service.getCachedEta('trip-1', 'student-1');
    expect(cached?.etaMinutes).toBe(8);
  });
});
