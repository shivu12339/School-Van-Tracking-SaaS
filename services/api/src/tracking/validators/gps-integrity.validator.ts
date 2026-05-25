import { BadRequestException } from '@nestjs/common';

export interface GpsIntegrityInput {
  latitude: number;
  longitude: number;
  speed: number;
  accuracy?: number;
  timestamp: string;
  isMocked?: boolean;
  altitude?: number;
}

export interface GpsIntegrityContext {
  lastLatitude?: number;
  lastLongitude?: number;
  lastTimestamp?: string;
}

export interface GpsIntegrityResult {
  valid: boolean;
  flags: string[];
  riskScore: number;
}

const MAX_SPEED_KMH = 150;
const MAX_TELEPORT_MPS = 80;
const MIN_ACCURACY_SUSPICIOUS = 100;

export class GpsIntegrityValidator {
  static evaluate(
    input: GpsIntegrityInput,
    context: GpsIntegrityContext = {},
  ): GpsIntegrityResult {
    const flags: string[] = [];
    let riskScore = 0;

    if (input.isMocked) {
      flags.push('MOCK_LOCATION');
      riskScore += 100;
    }

    if (input.speed > MAX_SPEED_KMH) {
      flags.push('IMPOSSIBLE_SPEED');
      riskScore += 50;
    }

    if (input.accuracy !== undefined && input.accuracy > MIN_ACCURACY_SUSPICIOUS && input.speed > 60) {
      flags.push('LOW_ACCURACY_HIGH_SPEED');
      riskScore += 30;
    }

    if (context.lastLatitude !== undefined && context.lastLongitude !== undefined && context.lastTimestamp) {
      const elapsedSec =
        (new Date(input.timestamp).getTime() - new Date(context.lastTimestamp).getTime()) / 1000;
      if (elapsedSec > 0 && elapsedSec < 300) {
        const distance = haversineMeters(
          context.lastLatitude,
          context.lastLongitude,
          input.latitude,
          input.longitude,
        );
        const speedMps = distance / elapsedSec;
        if (speedMps > MAX_TELEPORT_MPS) {
          flags.push('TELEPORT');
          riskScore += 60;
        }
      }
    }

    const eventTime = new Date(input.timestamp).getTime();
    const now = Date.now();
    if (eventTime > now + 60_000) {
      flags.push('FUTURE_TIMESTAMP');
      riskScore += 20;
    }
    if (eventTime < now - 7 * 24 * 60 * 60 * 1000) {
      flags.push('STALE_TIMESTAMP');
      riskScore += 15;
    }

    return {
      valid: riskScore < 80,
      flags,
      riskScore,
    };
  }

  static assertValid(input: GpsIntegrityInput, context?: GpsIntegrityContext): void {
    const result = this.evaluate(input, context);
    if (!result.valid) {
      throw new BadRequestException({
        message: 'GPS location rejected by integrity checks',
        flags: result.flags,
        riskScore: result.riskScore,
      });
    }
  }
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}
