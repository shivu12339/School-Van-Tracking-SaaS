import { RoleCode } from '@prisma/client';

export const TrackingRooms = {
  school: (schoolId: string) => `school:${schoolId}`,
  trip: (tripId: string) => `trip:${tripId}`,
  parent: (parentId: string) => `parent:${parentId}`,
  driver: (driverId: string) => `driver:${driverId}`,
  admin: (schoolId: string) => `admin:${schoolId}`,
  globalTrip: (tripId: string) => `global:trip:${tripId}`,
};

export function resolveJoinRooms(input: {
  role: RoleCode;
  schoolId: string;
  userId: string;
  tripId?: string;
  parentId?: string;
  driverId?: string;
  studentId?: string;
}): string[] {
  const rooms = new Set<string>();
  if (input.role === RoleCode.SUPER_ADMIN) {
    if (input.tripId) rooms.add(TrackingRooms.globalTrip(input.tripId));
    return [...rooms];
  }

  rooms.add(TrackingRooms.school(input.schoolId));

  if (input.role === RoleCode.SCHOOL_ADMIN) {
    rooms.add(TrackingRooms.admin(input.schoolId));
    if (input.tripId) rooms.add(TrackingRooms.trip(input.tripId));
  }

  if (input.role === RoleCode.DRIVER && input.driverId) {
    rooms.add(TrackingRooms.driver(input.driverId));
    if (input.tripId) rooms.add(TrackingRooms.trip(input.tripId));
  }

  if (input.role === RoleCode.PARENT && input.parentId) {
    rooms.add(TrackingRooms.parent(input.parentId));
    if (input.tripId) rooms.add(TrackingRooms.trip(input.tripId));
  }

  return [...rooms];
}
