import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_paths.dart';
import '../../core/network/dio_client.dart';
import 'package:go_router/go_router.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

final fcmServiceProvider = Provider<FcmService>((ref) {
  return FcmService(ref.watch(dioProvider), ref);
});

class FcmService {
  FcmService(this._client, this._ref);
  final DioClient _client;
  final Ref _ref;

  final _local = FlutterLocalNotificationsPlugin();
  GoRouter? _router;

  void bindRouter(GoRouter router) => _router = router;

  Future<void> initialize() async {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    await _local.initialize(
      const InitializationSettings(android: android),
      onDidReceiveNotificationResponse: (details) => _handlePayload(details.payload),
    );

    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission();
    final token = await messaging.getToken();
    if (token != null) await _registerToken(token);
    messaging.onTokenRefresh.listen(_registerToken);

    FirebaseMessaging.onMessage.listen(_showForeground);
    FirebaseMessaging.onMessageOpenedApp.listen((m) => _handlePayload(m.data['route'] as String?));
    final initial = await messaging.getInitialMessage();
    if (initial != null) _handlePayload(initial.data['route'] as String?);
  }

  void _showForeground(RemoteMessage message) {
    final n = message.notification;
    if (n == null) return;
    _local.show(
      message.hashCode,
      n.title,
      n.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'parent_alerts',
          'Van alerts',
          importance: Importance.high,
          priority: Priority.high,
        ),
      ),
      payload: message.data['route'] as String?,
    );
  }

  void _handlePayload(String? route) {
    if (route == null || _router == null) return;
    _router!.go(route);
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
