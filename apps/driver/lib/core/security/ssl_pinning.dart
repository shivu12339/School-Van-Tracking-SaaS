import 'package:dio/dio.dart';
import '../../config/app_config.dart';

/// SSL pinning hook — enable in prod via [AppConfig.enableSslPinning].
///
/// Production: add `dio_certificate_pinning` or custom [HttpClient] with
/// pinned SPKI hashes from your API gateway certificate rotation policy.
class SslPinningConfigurator {
  static void apply(Dio dio, AppConfig config) {
    if (!config.enableSslPinning) return;
    // Example (requires dio_certificate_pinning package in prod builds):
    // dio.httpClientAdapter = PinningClientAdapter(
    //   allowedSHAFingerprints: const ['AA:BB:...'],
    // );
  }
}
