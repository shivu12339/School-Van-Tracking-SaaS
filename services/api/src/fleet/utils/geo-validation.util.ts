import { BadRequestException } from '@nestjs/common';

export function assertValidCoordinates(
  latitude?: number | null,
  longitude?: number | null,
  label = 'Location',
): void {
  if (latitude == null && longitude == null) {
    return;
  }
  if (latitude == null || longitude == null) {
    throw new BadRequestException(`${label} requires both latitude and longitude`);
  }
  if (latitude < -90 || latitude > 90) {
    throw new BadRequestException(`${label} latitude must be between -90 and 90`);
  }
  if (longitude < -180 || longitude > 180) {
    throw new BadRequestException(`${label} longitude must be between -180 and 180`);
  }
}
