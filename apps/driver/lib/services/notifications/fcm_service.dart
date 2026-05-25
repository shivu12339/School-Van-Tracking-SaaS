import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_paths.dart';
import '../../core/network/dio_client.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

final fcmServiceProvider = Provider<FcmService>((ref) {
  return FcmService(ref.watch(dioProvider));
});

class FcmService {
  FcmService(this._client);
  final DioClient _client;

  Future<void> initialize() async {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission();
    final token = await messaging.getToken();
    if (token != null) {
      await _registerToken(token);
    }
    messaging.onTokenRefresh.listen(_registerToken);
    FirebaseMessaging.onMessage.listen((message) {
      // Foreground: show in-app banner via local notifications if needed
    });
  }

  Future<void> _registerToken(String token) async {
    try {
      await _client.post(
        ApiPaths.notificationsRegister,
        data: {
          'fcmToken': token,
          'deviceId': token.substring(0, 24),
          'platform': 'ANDROID',
        },
        parser: (_) => null,
      );
    } catch (_) {}
  }
}
