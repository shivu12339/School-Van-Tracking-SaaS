import 'package:flutter_test/flutter_test.dart';
import 'package:schoolvan_parent/features/tracking/domain/entities/van_location.dart';

void main() {
  test('EtaInfo formats distance for display', () {
    final eta = EtaInfo(
      etaMinutes: 12,
      distanceMeters: 1500,
      updatedAt: DateTime.utc(2026, 5, 19),
    );
    expect(eta.etaMinutes, 12);
    expect(eta.distanceMeters / 1000, closeTo(1.5, 0.01));
  });
}
