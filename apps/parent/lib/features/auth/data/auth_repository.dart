import 'dart:convert';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../../../core/constants/api_paths.dart';
import '../../../core/network/dio_client.dart';
import '../domain/entities/auth_user.dart';
import 'auth_token_storage.dart';

final authRepositoryProvider = Provider((ref) {
  return AuthRepository(ref.watch(dioProvider), ref.watch(authTokenStorageProvider));
});

class AuthRepository {
  AuthRepository(this._client, this._storage);
  final DioClient _client;
  final AuthTokenStorage _storage;

  Future<AuthUser> login({
    required String email,
    required String password,
    required String schoolCode,
  }) async {
    final info = await DeviceInfoPlugin().androidInfo;
    final pkg = await PackageInfo.fromPlatform();
    final data = await _client.post<Map<String, dynamic>>(
      ApiPaths.authLogin,
      data: {
        'email': email,
        'password': password,
        'schoolCode': schoolCode,
        'deviceId': info.id,
        'platform': 'ANDROID',
        'appVersion': pkg.version,
      },
      parser: (j) => j as Map<String, dynamic>,
    );
    final user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
    await _storage.saveTokens(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
      userJson: jsonEncode(user.toJson()),
    );
    return user;
  }

  Future<AuthUser?> restore() async {
    if (await _storage.getAccessToken() == null) return null;
    final cached = await _storage.getUserJson();
    if (cached != null) {
      return AuthUser.fromJson(jsonDecode(cached) as Map<String, dynamic>);
    }
    return _client.get(ApiPaths.authMe, parser: (j) => AuthUser.fromJson(j as Map<String, dynamic>));
  }

  Future<void> logout() async {
    final refresh = await _storage.getRefreshToken();
    if (refresh != null) {
      try {
        await _client.post(ApiPaths.authLogout, data: {'refreshToken': refresh}, parser: (_) => null);
      } catch (_) {}
    }
    await _storage.clear();
  }
}
