import 'package:flutter_test/flutter_test.dart';
import 'package:schoolvan_parent/core/constants/socket_events.dart';

void main() {
  test('parent socket events match backend contract', () {
    expect(SocketEvents.vanLocation, 'van:location');
    expect(SocketEvents.etaUpdate, 'eta:update');
    expect(SocketEvents.tripStatus, 'trip:status');
    expect(SocketEvents.studentPicked, 'student:picked');
    expect(SocketEvents.studentDropped, 'student:dropped');
    expect(SocketEvents.notificationNew, 'notification:new');
  });
}
