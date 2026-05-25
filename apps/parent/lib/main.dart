import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'services/connectivity/connectivity_watcher.dart';
import 'services/local/parent_cache.dart';
import 'services/notifications/fcm_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ParentCache.init();

  final container = ProviderContainer();
  container.read(connectivityWatcherProvider).start();
  try {
    await container.read(fcmServiceProvider).initialize();
  } catch (_) {
    // Firebase optional without google-services.json
  }

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const SchoolVanParentApp(),
    ),
  );
}
