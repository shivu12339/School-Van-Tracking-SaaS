import { BadRequestException } from '@nestjs/common';
import { TripStatus } from '@prisma/client';
import { canTransition } from './trip-state-machine';

export class TripLifecycleValidator {
  static assertTransition(current: TripStatus, next: TripStatus): void {
    if (!canTransition(current, next)) {
      throw new BadRequestException(
        `Invalid trip status transition: ${current} → ${next}`,
      );
    }
  }

  static assertSchedulable(status: TripStatus): void {
    if (status !== TripStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled trips can be modified');
    }
  }
}
