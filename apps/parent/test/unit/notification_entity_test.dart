import 'package:flutter_test/flutter_test.dart';
import 'package:schoolvan_parent/features/notifications/domain/entities/app_notification.dart';

void main() {
  test('AppNotification read state', () {
    final n = AppNotification.fromJson({
      'id': 'n1',
      'title': 'Van nearby',
      'body': 'Within 500m',
      'type': 'GEOFENCE_500M',
      'createdAt': '2026-05-19T10:00:00.000Z',
    });
    expect(n.isRead, false);
    final read = AppNotification.fromJson({
      ...{
        'id': 'n1',
        'title': 'Van nearby',
        'body': 'Within 500m',
        'type': 'GEOFENCE_500M',
        'createdAt': '2026-05-19T10:00:00.000Z',
      },
      'readAt': '2026-05-19T10:05:00.000Z',
    });
    expect(read.isRead, true);
  });
}
