import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../features/tracking/domain/entities/gps_point.dart';
import '../../features/tracking/data/tracking_repository.dart';
import '../socket/tracking_socket_manager.dart';
import '../sync/offline_sync_service.dart';
import '../../core/errors/app_exception.dart';

final locationTrackingServiceProvider = Provider<LocationTrackingService>((ref) {
  return LocationTrackingService(
    socket: ref.watch(trackingSocketProvider),
    offline: ref.watch(offlineSyncServiceProvider),
    tracking: ref.watch(trackingRepositoryProvider),
  );
});

class LocationTrackingService {
  LocationTrackingService({
    required TrackingSocketManager socket,
    required OfflineSyncService offline,
    required TrackingRepository tracking,
  })  : _socket = socket,
        _offline = offline,
        _tracking = tracking;

  final TrackingSocketManager _socket;
  final OfflineSyncService _offline;
  final TrackingRepository _tracking;

  StreamSubscription<Position>? _subscription;
  String? _activeTripId;
  DateTime? _lastSent;
  static const _minInterval = Duration(seconds: 4);
  static const _minAccuracyMeters = 80.0;

  Future<void> ensurePermissions() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever ||
        permission == LocationPermission.denied) {
      throw const LocationException('Location permission denied');
    }
  }

  Future<void> start(String tripId) async {
    await ensurePermissions();
    _activeTripId = tripId;
    await Geolocator.requestPermission();
    _subscription?.cancel();
    _subscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 8,
      ),
    ).listen(_onPosition, onError: (_) {});
  }

  Future<void> stop() async {
    await _subscription?.cancel();
    _subscription = null;
    _activeTripId = null;
  }

  Future<void> _onPosition(Position position) async {
    final tripId = _activeTripId;
    if (tripId == null) return;
    if (position.isMocked) return;
    if (position.accuracy > _minAccuracyMeters) return;

    final now = DateTime.now();
    if (_lastSent != null && now.difference(_lastSent!) < _minInterval) return;
    _lastSent = now;

    final point = GpsPoint(
      tripId: tripId,
      latitude: position.latitude,
      longitude: position.longitude,
      speed: position.speed >= 0 ? position.speed * 3.6 : 0,
      heading: position.heading >= 0 ? position.heading : 0,
      timestamp: now.toUtc(),
      accuracy: position.accuracy,
    );

    try {
      if (_socket.isConnected) {
        _socket.emitTrackingUpdate(point);
      } else if (await _offline.isOnline()) {
        await _tracking.pushLocation(point);
      } else {
        await _offline.enqueueGps(point);
      }
    } catch (_) {
      await _offline.enqueueGps(point);
    }
    await _offline.syncIfOnline();
  }
}
