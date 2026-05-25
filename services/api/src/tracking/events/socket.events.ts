export const SOCKET_EVENTS = {
  DRIVER: {
    TRIP_START: 'trip:start',
    TRIP_STOP: 'trip:stop',
    TRACKING_UPDATE: 'tracking:update',
    STUDENT_PICKED: 'student:picked',
    STUDENT_DROPPED: 'student:dropped',
    SOS_TRIGGERED: 'sos:triggered',
  },
  PARENT: {
    VAN_LOCATION: 'van:location',
    TRIP_STATUS: 'trip:status',
    STUDENT_PICKED: 'student:picked',
    STUDENT_DROPPED: 'student:dropped',
    NOTIFICATION_NEW: 'notification:new',
    ETA_UPDATE: 'eta:update',
  },
  ADMIN: {
    DRIVER_ONLINE: 'driver:online',
    TRIP_STARTED: 'trip:started',
    TRIP_STOPPED: 'trip:stopped',
    VAN_LIVE: 'van:live',
    SOS_ALERT: 'sos:alert',
  },
  SERVER: {
    CONNECTED: 'server:connected',
    ERROR: 'server:error',
  },
} as const;

export const TRACKING_CHANNELS = {
  tripBroadcast: (tripId: string) => `tracking:trip:${tripId}`,
  schoolBroadcast: (schoolId: string) => `tracking:school:${schoolId}`,
  etaBroadcast: (tripId: string) => `tracking:eta:${tripId}`,
  schoolEtaBroadcast: (schoolId: string) => `tracking:school:${schoolId}:eta`,
} as const;

export const SOCKET_HEARTBEAT = {
  PING: 'ping',
  PONG: 'pong',
} as const;
