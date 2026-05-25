import { NotificationType } from '@prisma/client';
import { GeofenceAlertEngine } from '../../src/notifications/services/geofence-alert.engine';

describe('GeofenceAlertEngine', () => {
  const radiusService = {
    findPendingStudentsWithDistance: jest.fn(),
  };
  const dispatcher = { dispatch: jest.fn() };
  const redisCache = { setGeofenceCooldown: jest.fn() };

  let engine: GeofenceAlertEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new GeofenceAlertEngine(
      radiusService as never,
      dispatcher as never,
      redisCache as never,
    );
  });

  it('queues 500m alert before 1km for close students', async () => {
    radiusService.findPendingStudentsWithDistance.mockResolvedValue([
      {
        studentId: 's1',
        parentId: 'p1',
        parentUserId: 'u1',
        distanceMeters: 400,
      },
    ]);
    redisCache.setGeofenceCooldown.mockResolvedValue(true);
    dispatcher.dispatch.mockResolvedValue('notif-1');

    await engine.evaluate({
      schoolId: 'school-1',
      tripId: 'trip-1',
      latitude: 12.9,
      longitude: 77.6,
      radius1Km: 1000,
      radius500m: 500,
    });

    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.VAN_WITHIN_500M }),
    );
    expect(dispatcher.dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.VAN_WITHIN_1KM }),
    );
  });

  it('skips when geofence cooldown is active', async () => {
    radiusService.findPendingStudentsWithDistance.mockResolvedValue([
      {
        studentId: 's1',
        parentId: 'p1',
        parentUserId: 'u1',
        distanceMeters: 900,
      },
    ]);
    redisCache.setGeofenceCooldown.mockResolvedValue(false);

    await engine.evaluate({
      schoolId: 'school-1',
      tripId: 'trip-1',
      latitude: 12.9,
      longitude: 77.6,
      radius1Km: 1000,
      radius500m: 500,
    });

    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });
});
