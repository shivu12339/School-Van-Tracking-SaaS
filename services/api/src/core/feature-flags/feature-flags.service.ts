import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type FeatureFlag =
  | 'REALTIME_TRACKING'
  | 'GEOFENCE_ALERTS'
  | 'PUSH_NOTIFICATIONS'
  | 'MAINTENANCE_MODE';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly config: ConfigService) {}

  isEnabled(flag: FeatureFlag): boolean {
    if (this.config.get<string>('FEATURE_MAINTENANCE_MODE') === 'true') {
      return flag === 'MAINTENANCE_MODE';
    }
    const key = `FEATURE_${flag}`;
    const value = this.config.get<string>(key);
    if (value === undefined) return true;
    return value === 'true' || value === '1';
  }
}
