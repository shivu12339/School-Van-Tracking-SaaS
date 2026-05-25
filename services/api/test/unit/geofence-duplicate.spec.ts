import { NotificationType } from '@prisma/client';
import { GeofenceAlertEngine } from '../../src/notifications/services/geofence-alert.engine';

/** Validates 1km vs 500m priority and duplicate cooldown (STEP 13). */
describe('Geofence duplicate prevention', () => {
  const radiusService = { findPendingStudentsWithDistance: jest.fn() };
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

  it('sends only 1km when student is between 500m and 1km', async () => {
    radiusService.findPendingStudentsWithDistance.mockResolvedValue([
      { studentId: 's1', parentId: 'p1', parentUserId: 'u1', distanceMeters: 750 },
    ]);
    redisCache.setGeofenceCooldown.mockResolvedValue(true);
    dispatcher.dispatch.mockResolvedValue('n1');

    await engine.evaluate({
      schoolId: 'school-1',
      tripId: 'trip-1',
      latitude: 12.9,
      longitude: 77.6,
      radius1Km: 1000,
      radius500m: 500,
    });

    expect(dispatcher.dispatch).toHaveBeenCalledTimes(1);
    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.VAN_WITHIN_1KM }),
    );
  });

  it('does not dispatch when cooldown rejects', async () => {
    radiusService.findPendingStudentsWithDistance.mockResolvedValue([
      { studentId: 's1', parentId: 'p1', parentUserId: 'u1', distanceMeters: 400 },
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
