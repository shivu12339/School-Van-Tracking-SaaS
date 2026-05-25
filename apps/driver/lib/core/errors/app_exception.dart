sealed class AppException implements Exception {
  const AppException(this.message);
  final String message;

  @override
  String toString() => message;
}

class NetworkException extends AppException {
  const NetworkException([super.message = 'Network error']);
}

class AuthException extends AppException {
  const AuthException([super.message = 'Authentication failed']);
}

class LocationException extends AppException {
  const LocationException([super.message = 'Location unavailable']);
}

class SocketException extends AppException {
  const SocketException([super.message = 'Realtime connection error']);
}
