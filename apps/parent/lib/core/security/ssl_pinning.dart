import 'package:dio/dio.dart';
import '../../config/app_config.dart';

/// Configure certificate pinning in production builds.
/// Wire `dio_http_cache` / custom `HttpClient` with pinned SPKI hashes.
void configureSslPinning(Dio dio, AppConfig config) {
  if (!config.enableSslPinning) return;
  // Production: attach SecurityContext with pinned certificates.
}
