import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final authTokenStorageProvider = Provider<AuthTokenStorage>(
  (ref) => const AuthTokenStorage(),
);

class AuthTokenStorage {
  const AuthTokenStorage();

  static const _accessKey = 'sv_access';
  static const _refreshKey = 'sv_refresh';
  static const _userKey = 'sv_user';

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    String? userJson,
  }) async {
    await _storage.write(key: _accessKey, value: accessToken);
    await _storage.write(key: _refreshKey, value: refreshToken);
    if (userJson != null) await _storage.write(key: _userKey, value: userJson);
  }

  Future<String?> getAccessToken() => _storage.read(key: _accessKey);
  Future<String?> getRefreshToken() => _storage.read(key: _refreshKey);
  Future<String?> getUserJson() => _storage.read(key: _userKey);

  Future<void> clear() async {
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
    await _storage.delete(key: _userKey);
  }
}
