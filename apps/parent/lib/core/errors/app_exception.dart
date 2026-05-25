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
