import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final authTokenStorageProvider = Provider((ref) => const AuthTokenStorage());

class AuthTokenStorage {
  const AuthTokenStorage();

  static const _access = 'sv_parent_access';
  static const _refresh = 'sv_parent_refresh';
  static const _user = 'sv_parent_user';

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    String? userJson,
  }) async {
    await _storage.write(key: _access, value: accessToken);
    await _storage.write(key: _refresh, value: refreshToken);
    if (userJson != null) await _storage.write(key: _user, value: userJson);
  }

  Future<String?> getAccessToken() => _storage.read(key: _access);
  Future<String?> getRefreshToken() => _storage.read(key: _refresh);
  Future<String?> getUserJson() => _storage.read(key: _user);
  Future<void> clear() async {
    await _storage.delete(key: _access);
    await _storage.delete(key: _refresh);
    await _storage.delete(key: _user);
  }
}
