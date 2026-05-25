import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:geolocator/geolocator.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../../features/tracking/domain/entities/gps_point.dart';

const _gpsIsolateBox = 'gps_queue';

@pragma('vm:entry-point')
Future<void> onBackgroundStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();
  await Hive.initFlutter();
  if (!Hive.isBoxOpen(_gpsIsolateBox)) {
    await Hive.openBox<Map>(_gpsIsolateBox);
  }

  if (service is AndroidServiceInstance) {
    service.on('setAsForeground').listen((_) {
      service.setAsForegroundService();
    });
    service.setForegroundNotificationInfo(
      title: 'School Van tracking',
      content: 'GPS active for active trip',
    );
  }

  service.on('stopService').listen((_) {
    _positionSub?.cancel();
    service.stopSelf();
  });

  service.on('startTracking').listen((event) {
    final tripId = event?['tripId'] as String?;
    if (tripId != null) _startGpsLoop(service, tripId);
  });

  service.on('tripId').listen((event) {
    final tripId = event?['tripId'] as String?;
    if (tripId != null) _startGpsLoop(service, tripId);
  });
}

StreamSubscription<Position>? _positionSub;
DateTime? _lastBgSent;

void _startGpsLoop(ServiceInstance service, String tripId) {
  _positionSub?.cancel();
  _positionSub = Geolocator.getPositionStream(
    locationSettings: const LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    ),
  ).listen((position) async {
    if (position.isMocked) return;
    if (position.accuracy > 80) return;
    final now = DateTime.now();
    if (_lastBgSent != null && now.difference(_lastBgSent!) < const Duration(seconds: 4)) {
      return;
    }
    _lastBgSent = now;

    final point = GpsPoint(
      tripId: tripId,
      latitude: position.latitude,
      longitude: position.longitude,
      speed: position.speed >= 0 ? position.speed * 3.6 : 0,
      heading: position.heading >= 0 ? position.heading : 0,
      timestamp: now.toUtc(),
      accuracy: position.accuracy,
    );

    final box = Hive.box<Map>(_gpsIsolateBox);
    await box.put('${now.millisecondsSinceEpoch}', point.toHive());

    if (service is AndroidServiceInstance) {
      service.setForegroundNotificationInfo(
        title: 'Trip in progress',
        content: 'Last fix: ${now.toLocal().toString().substring(11, 19)}',
      );
    }
  });
}

class BackgroundLocationService {
  static Future<void> initialize() async {
    final service = FlutterBackgroundService();
    await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onBackgroundStart,
        isForegroundMode: true,
        autoStart: false,
        foregroundServiceNotificationId: 888,
        initialNotificationTitle: 'School Van Driver',
        initialNotificationContent: 'GPS tracking ready',
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: onBackgroundStart,
        onBackground: onIosBackground,
      ),
    );
  }

  @pragma('vm:entry-point')
  static Future<bool> onIosBackground(ServiceInstance service) async {
    WidgetsFlutterBinding.ensureInitialized();
    DartPluginRegistrant.ensureInitialized();
    return true;
  }

  static Future<void> start(String tripId) async {
    final service = FlutterBackgroundService();
    final running = await service.isRunning();
    if (!running) {
      await service.startService();
    }
    service.invoke('setAsForeground');
    service.invoke('startTracking', {'tripId': tripId});
  }

  static Future<void> stop() async {
    _positionSub?.cancel();
    final service = FlutterBackgroundService();
    service.invoke('stopService');
  }
}
