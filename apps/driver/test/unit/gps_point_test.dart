import 'package:flutter_test/flutter_test.dart';
import 'package:schoolvan_driver/features/tracking/domain/entities/gps_point.dart';

void main() {
  test('GpsPoint round-trips through Hive map', () {
    final point = GpsPoint(
      tripId: 'trip-1',
      latitude: 12.97,
      longitude: 77.59,
      speed: 30,
      heading: 90,
      timestamp: DateTime.utc(2026, 5, 19, 10, 0),
      accuracy: 12,
    );
    final restored = GpsPoint.fromHive(point.toHive());
    expect(restored.tripId, point.tripId);
    expect(restored.latitude, point.latitude);
    expect(restored.longitude, point.longitude);
    expect(restored.speed, point.speed);
    expect(restored.heading, point.heading);
    expect(restored.accuracy, point.accuracy);
  });
}
