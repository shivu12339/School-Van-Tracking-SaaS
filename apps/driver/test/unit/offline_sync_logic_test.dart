import 'package:flutter_test/flutter_test.dart';
import 'package:schoolvan_driver/features/tracking/domain/entities/gps_point.dart';

void main() {
  test('offline GPS queue serializes for sync batch', () {
    final points = List.generate(
      3,
      (i) => GpsPoint(
        tripId: 'trip-1',
        latitude: 12.97 + i * 0.001,
        longitude: 77.59,
        speed: 20,
        heading: 90,
        timestamp: DateTime.utc(2026, 5, 19, 10, i),
      ),
    );
    final payload = points.map((p) => p.toLocationJson()).toList();
    expect(payload.length, 3);
    expect(payload.first['latitude'], 12.97);
  });
}
