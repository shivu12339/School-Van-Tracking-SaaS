import 'dart:convert';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../../../core/constants/api_paths.dart';
import '../../../core/network/dio_client.dart';
import '../domain/entities/auth_user.dart';
import 'auth_token_storage.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    client: ref.watch(dioProvider),
    storage: ref.watch(authTokenStorageProvider),
  );
});

class AuthRepository {
  AuthRepository({required DioClient client, required AuthTokenStorage storage})
      : _client = client,
        _storage = storage;

  final DioClient _client;
  final AuthTokenStorage _storage;

  Future<AuthUser> login({
    required String email,
    required String password,
    required String schoolCode,
  }) async {
    final deviceInfo = DeviceInfoPlugin();
    final package = await PackageInfo.fromPlatform();
    final android = await deviceInfo.androidInfo;
    final data = await _client.post<Map<String, dynamic>>(
      ApiPaths.authLogin,
      data: {
        'email': email,
        'password': password,
        'schoolCode': schoolCode,
        'deviceId': android.id,
        'platform': 'ANDROID',
        'appVersion': package.version,
      },
      parser: (json) => json as Map<String, dynamic>,
    );
    final user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
    await _storage.saveTokens(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
      userJson: jsonEncode(user.toJson()),
    );
    return user;
  }

  Future<AuthUser?> restoreSession() async {
    final token = await _storage.getAccessToken();
    final userJson = await _storage.getUserJson();
    if (token == null) return null;
    if (userJson != null) {
      return AuthUser.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
    }
    return _client.get<AuthUser>(
      ApiPaths.authMe,
      parser: (json) => AuthUser.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<void> logout() async {
    final refresh = await _storage.getRefreshToken();
    if (refresh != null) {
      try {
        await _client.post(
          ApiPaths.authLogout,
          data: {'refreshToken': refresh},
          parser: (_) => null,
        );
      } catch (_) {}
    }
    await _storage.clear();
  }
}
