import { type ConfigService } from '@nestjs/config';
import { FeatureFlagsService } from '../../src/core/feature-flags/feature-flags.service';

describe('FeatureFlagsService', () => {
  it('disables features when maintenance mode is on', () => {
    const config = {
      get: (key: string) => {
        if (key === 'FEATURE_MAINTENANCE_MODE') return 'true';
        return undefined;
      },
    } as ConfigService;
    const flags = new FeatureFlagsService(config);
    expect(flags.isEnabled('REALTIME_TRACKING')).toBe(false);
    expect(flags.isEnabled('MAINTENANCE_MODE')).toBe(true);
  });

  it('respects explicit feature env', () => {
    const config = {
      get: (key: string) => {
        if (key === 'FEATURE_GEOFENCE_ALERTS') return 'false';
        return undefined;
      },
    } as ConfigService;
    const flags = new FeatureFlagsService(config);
    expect(flags.isEnabled('GEOFENCE_ALERTS')).toBe(false);
    expect(flags.isEnabled('PUSH_NOTIFICATIONS')).toBe(true);
  });
});
