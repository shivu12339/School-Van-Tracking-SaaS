import { GpsIntegrityValidator } from '../../src/tracking/validators/gps-integrity.validator';

describe('GpsIntegrityValidator', () => {
  const base = {
    latitude: 12.97,
    longitude: 77.59,
    speed: 30,
    timestamp: new Date().toISOString(),
  };

  it('rejects mocked GPS', () => {
    const r = GpsIntegrityValidator.evaluate({ ...base, isMocked: true });
    expect(r.valid).toBe(false);
    expect(r.flags).toContain('MOCK_LOCATION');
  });

  it('rejects impossible speed', () => {
    const r = GpsIntegrityValidator.evaluate({ ...base, speed: 200 });
    expect(r.flags).toContain('IMPOSSIBLE_SPEED');
  });

  it('flags teleport between samples', () => {
    const r = GpsIntegrityValidator.evaluate(
      { ...base, latitude: 13.5, longitude: 78.5, timestamp: new Date().toISOString() },
      {
        lastLatitude: 12.97,
        lastLongitude: 77.59,
        lastTimestamp: new Date(Date.now() - 5000).toISOString(),
      },
    );
    expect(r.flags).toContain('TELEPORT');
  });

  it('accepts normal movement', () => {
    const r = GpsIntegrityValidator.evaluate(base);
    expect(r.valid).toBe(true);
    expect(r.riskScore).toBeLessThan(80);
  });
});
