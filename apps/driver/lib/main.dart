import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'services/local/hive_boxes.dart';
import 'services/location/background_location_service.dart';
import 'services/connectivity/connectivity_watcher.dart';
import 'services/notifications/fcm_service.dart';
import 'services/sync/offline_sync_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await HiveBoxes.init();
  await BackgroundLocationService.initialize();

  final container = ProviderContainer();
  container.read(connectivityWatcherProvider).start();
  try {
    await container.read(fcmServiceProvider).initialize();
  } catch (_) {
    // Firebase optional in local dev without google-services.json
  }
  await container.read(offlineSyncServiceProvider).syncIfOnline();

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const SchoolVanDriverApp(),
    ),
  );
}
