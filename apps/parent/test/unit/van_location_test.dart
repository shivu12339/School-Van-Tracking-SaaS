import 'package:flutter_test/flutter_test.dart';
import 'package:schoolvan_parent/features/tracking/domain/entities/van_location.dart';

void main() {
  test('VanLocation parses API payload', () {
    final loc = VanLocation.fromJson({
      'tripId': 't1',
      'latitude': 12.97,
      'longitude': 77.59,
      'speed': 25,
      'heading': 180,
      'timestamp': '2026-05-19T10:00:00.000Z',
    });
    expect(loc.tripId, 't1');
    expect(loc.latitude, 12.97);
    expect(loc.speed, 25);
  });

  test('EtaInfo parses API payload', () {
    final eta = EtaInfo.fromJson({
      'etaMinutes': 8,
      'distanceMeters': 1200,
      'updatedAt': '2026-05-19T10:00:00.000Z',
    });
    expect(eta.etaMinutes, 8);
    expect(eta.distanceMeters, 1200);
  });
}
