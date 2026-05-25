import { RadiusCalculationService } from '../../src/notifications/services/radius-calculation.service';

describe('RadiusCalculationService', () => {
  const service = new RadiusCalculationService({} as never);

  it('computes haversine distance between two points', () => {
    const meters = service.haversineMeters(12.9716, 77.5946, 12.9352, 77.6245);
    expect(meters).toBeGreaterThan(4000);
    expect(meters).toBeLessThan(6000);
  });
});
