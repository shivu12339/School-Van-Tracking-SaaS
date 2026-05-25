import { RoleCode } from '@prisma/client';
import { resolveJoinRooms, TrackingRooms } from '../../src/tracking/utils/rooms.util';

describe('resolveJoinRooms', () => {
  it('parent joins parent and trip rooms only for their school', () => {
    const rooms = resolveJoinRooms({
      role: RoleCode.PARENT,
      schoolId: 'school-a',
      userId: 'u1',
      tripId: 'trip-1',
      parentId: 'parent-1',
    });
    expect(rooms).toContain(TrackingRooms.parent('parent-1'));
    expect(rooms).toContain(TrackingRooms.trip('trip-1'));
    expect(rooms).toContain(TrackingRooms.school('school-a'));
    expect(rooms).not.toContain(TrackingRooms.admin('school-a'));
  });

  it('driver joins driver and trip rooms', () => {
    const rooms = resolveJoinRooms({
      role: RoleCode.DRIVER,
      schoolId: 'school-a',
      userId: 'u1',
      tripId: 'trip-1',
      driverId: 'driver-1',
    });
    expect(rooms).toContain(TrackingRooms.driver('driver-1'));
    expect(rooms).toContain(TrackingRooms.trip('trip-1'));
  });

  it('super admin only joins global trip room when tripId set', () => {
    const rooms = resolveJoinRooms({
      role: RoleCode.SUPER_ADMIN,
      schoolId: 'school-a',
      userId: 'u1',
      tripId: 'trip-1',
    });
    expect(rooms).toEqual([TrackingRooms.globalTrip('trip-1')]);
  });
});
