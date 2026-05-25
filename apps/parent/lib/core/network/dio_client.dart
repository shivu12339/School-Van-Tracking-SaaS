import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/app_config.dart';
import '../errors/app_exception.dart';
import '../../features/auth/data/auth_token_storage.dart';

final appConfigProvider = Provider<AppConfig>((ref) {
  const flavor = String.fromEnvironment('FLAVOR', defaultValue: 'dev');
  return AppConfig.fromFlavor(flavor);
});

final dioProvider = Provider<DioClient>((ref) {
  return DioClient(
    config: ref.watch(appConfigProvider),
    tokenStorage: ref.watch(authTokenStorageProvider),
  );
});

class DioClient {
  DioClient({required AppConfig config, required AuthTokenStorage tokenStorage})
      : _tokenStorage = tokenStorage,
        _dio = Dio(BaseOptions(
          baseUrl: config.apiBaseUrl,
          connectTimeout: const Duration(seconds: 20),
          receiveTimeout: const Duration(seconds: 20),
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _tokenStorage.getAccessToken();
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final ok = await _refresh();
          if (ok) {
            final opts = error.requestOptions;
            opts.headers['Authorization'] = 'Bearer ${await _tokenStorage.getAccessToken()}';
            return handler.resolve(await _dio.fetch(opts));
          }
        }
        handler.next(error);
      },
    ));
  }

  final Dio _dio;
  final AuthTokenStorage _tokenStorage;

  Future<bool> _refresh() async {
    final refresh = await _tokenStorage.getRefreshToken();
    if (refresh == null) return false;
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refresh},
        options: Options(headers: {'Authorization': null}),
      );
      final data = res.data?['data'] ?? res.data;
      if (data is! Map<String, dynamic>) return false;
      await _tokenStorage.saveTokens(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );
      return true;
    } catch (_) {
      await _tokenStorage.clear();
      return false;
    }
  }

  Future<T> get<T>(String path, {Map<String, dynamic>? query, required T Function(dynamic) parser}) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(path, queryParameters: query);
      return _parse(res.data, parser);
    } on DioException catch (e) {
      throw _map(e);
    }
  }

  Future<T> post<T>(String path, {Object? data, required T Function(dynamic) parser}) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(path, data: data);
      return _parse(res.data, parser);
    } on DioException catch (e) {
      throw _map(e);
    }
  }

  Future<T> patch<T>(String path, {Object? data, required T Function(dynamic) parser}) async {
    try {
      final res = await _dio.patch<Map<String, dynamic>>(path, data: data);
      return _parse(res.data, parser);
    } on DioException catch (e) {
      throw _map(e);
    }
  }

  T _parse<T>(Map<String, dynamic>? json, T Function(dynamic) parser) {
    if (json == null) throw const NetworkException('Empty response');
    if (json.containsKey('data')) return parser(json['data']);
    return parser(json);
  }

  AppException _map(DioException e) {
    final msg = e.response?.data is Map ? (e.response!.data['message'] as String?) : e.message;
    if (e.response?.statusCode == 401) return AuthException(msg ?? 'Unauthorized');
    return NetworkException(msg ?? 'Request failed');
  }
}
