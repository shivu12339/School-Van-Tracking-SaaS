import 'package:flutter_test/flutter_test.dart';
import 'package:schoolvan_driver/core/constants/socket_events.dart';

void main() {
  test('tracking socket event names are stable', () {
    expect(SocketEvents.trackingUpdate, 'tracking:update');
    expect(SocketEvents.tripStart, 'trip:start');
    expect(SocketEvents.tripStop, 'trip:stop');
    expect(SocketEvents.studentPicked, 'student:picked');
    expect(SocketEvents.studentDropped, 'student:dropped');
    expect(SocketEvents.sosTriggered, 'sos:triggered');
  });
}
