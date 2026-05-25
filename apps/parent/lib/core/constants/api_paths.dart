class ApiPaths {
  static const authLogin = '/auth/login';
  static const authRefresh = '/auth/refresh';
  static const authLogout = '/auth/logout';
  static const authMe = '/auth/me';
  static const parentChildren = '/parent/children';
  static String parentActiveTrip(String studentId) => '/parent/children/$studentId/active-trip';
  static String parentTripHistory(String studentId) => '/parent/children/$studentId/trip-history';
  static String parentTripOverview(String tripId, String studentId) =>
      '/parent/trips/$tripId/students/$studentId';
  static String parentLive(String tripId) => '/parent/trips/$tripId/live';
  static String parentEta(String tripId) => '/parent/trips/$tripId/eta';
  static String parentPlayback(String tripId) => '/parent/trips/$tripId/playback';
  static const notifications = '/notifications';
  static const notificationsUnreadCount = '/notifications/unread-count';
  static const notificationsReadAll = '/notifications/read-all';
  static String notificationRead(String id) => '/notifications/$id/read';
  static const notificationsRegister = '/notifications/register-device';
}
