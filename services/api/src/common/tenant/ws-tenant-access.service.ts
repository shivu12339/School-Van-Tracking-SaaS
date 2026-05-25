import { ForbiddenException, Injectable } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../auth/types/auth-user.type';

@Injectable()
export class WsTenantAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates that a user may join websocket rooms for a trip / tenant context.
   */
  async assertTripAccess(user: AuthUser, tripId: string): Promise<{ schoolId: string }> {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, deletedAt: null },
      select: { schoolId: true, driverId: true },
    });
    if (!trip) {
      throw new ForbiddenException('Trip not found');
    }

    if (user.role === RoleCode.SUPER_ADMIN) {
      return { schoolId: trip.schoolId };
    }

    if (!user.schoolId || user.schoolId !== trip.schoolId) {
      throw new ForbiddenException('Cross-tenant trip access denied');
    }

    if (user.role === RoleCode.DRIVER) {
      const driver = await this.prisma.driver.findFirst({
        where: { userId: user.id, schoolId: trip.schoolId },
      });
      if (!driver || driver.id !== trip.driverId) {
        throw new ForbiddenException('Driver not assigned to this trip');
      }
    }

    if (user.role === RoleCode.PARENT) {
      const parent = await this.prisma.parent.findFirst({
        where: { userId: user.id, schoolId: trip.schoolId },
      });
      if (!parent) {
        throw new ForbiddenException('Parent profile not found');
      }
      const linked = await this.prisma.tripStudent.findFirst({
        where: {
          tripId,
          student: { parentId: parent.id },
        },
      });
      if (!linked) {
        throw new ForbiddenException('Parent has no student on this trip');
      }
    }

    return { schoolId: trip.schoolId };
  }

  assertSchoolRoomAccess(user: AuthUser, schoolId: string): void {
    if (user.role === RoleCode.SUPER_ADMIN) {
      return;
    }
    if (!user.schoolId || user.schoolId !== schoolId) {
      throw new ForbiddenException('Cross-tenant school room access denied');
    }
  }
}
