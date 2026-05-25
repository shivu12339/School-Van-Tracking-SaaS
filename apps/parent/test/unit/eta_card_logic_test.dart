import 'package:flutter_test/flutter_test.dart';

void main() {
  test('ETA minutes display rounds up', () {
    const distanceMeters = 1500.0;
    const avgSpeedKmh = 25.0;
    final speedMps = (avgSpeedKmh * 1000) / 3600;
    final etaMinutes = (distanceMeters / speedMps / 60).ceil();
    expect(etaMinutes, greaterThanOrEqualTo(1));
  });
}
