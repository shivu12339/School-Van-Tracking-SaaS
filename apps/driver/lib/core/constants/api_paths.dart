class ApiPaths {
  static const authLogin = '/auth/login';
  static const authRefresh = '/auth/refresh';
  static const authLogout = '/auth/logout';
  static const authMe = '/auth/me';
  static const driverTrips = '/driver/trips';
  static const driverTripsHistory = '/driver/trips/history';
  static String driverTrip(String id) => '/driver/trips/$id';
  static String driverTripStudents(String id) => '/driver/trips/$id/students';
  static const trackingStart = '/tracking/trips/start';
  static const trackingStop = '/tracking/trips/stop';
  static const trackingLocation = '/tracking/location';
  static const trackingSync = '/tracking/sync';
  static String trackingPickup(String tripId, String studentId) =>
      '/tracking/trips/$tripId/students/$studentId/pickup';
  static String trackingDropoff(String tripId, String studentId) =>
      '/tracking/trips/$tripId/students/$studentId/dropoff';
  static String trackingSos(String tripId) => '/tracking/trips/$tripId/sos';
  static const notificationsRegister = '/notifications/register-device';
}
