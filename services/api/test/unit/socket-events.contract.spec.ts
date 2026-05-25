import { SOCKET_EVENTS } from '../../src/tracking/events/socket.events';

describe('Socket event contracts', () => {
  it('driver and parent student events align', () => {
    expect(SOCKET_EVENTS.DRIVER.STUDENT_PICKED).toBe(SOCKET_EVENTS.PARENT.STUDENT_PICKED);
    expect(SOCKET_EVENTS.DRIVER.STUDENT_DROPPED).toBe(SOCKET_EVENTS.PARENT.STUDENT_DROPPED);
  });

  it('tracking update event name is stable', () => {
    expect(SOCKET_EVENTS.DRIVER.TRACKING_UPDATE).toBe('tracking:update');
    expect(SOCKET_EVENTS.PARENT.VAN_LOCATION).toBe('van:location');
    expect(SOCKET_EVENTS.PARENT.ETA_UPDATE).toBe('eta:update');
  });
});
