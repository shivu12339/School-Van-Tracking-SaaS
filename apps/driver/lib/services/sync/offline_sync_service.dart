import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../features/students/data/students_repository.dart';
import '../../features/tracking/data/tracking_repository.dart';
import '../../features/tracking/domain/entities/gps_point.dart';
import '../local/hive_boxes.dart';
import '../socket/tracking_socket_manager.dart';

final offlineSyncServiceProvider = Provider<OfflineSyncService>((ref) {
  return OfflineSyncService(
    ref.watch(trackingRepositoryProvider),
    ref.watch(studentsRepositoryProvider),
    ref.watch(trackingSocketProvider),
  );
});

class OfflineSyncService {
  OfflineSyncService(this._tracking, this._students, this._socket);

  final TrackingRepository _tracking;
  final StudentsRepository _students;
  final TrackingSocketManager _socket;
  final _uuid = const Uuid();

  Future<void> enqueueGps(GpsPoint point) async {
    await HiveBoxes.gps.put(_uuid.v4(), point.toHive());
  }

  Future<void> enqueueAction(String type, Map<String, dynamic> payload) async {
    await HiveBoxes.actions.put(_uuid.v4(), {
      'type': type,
      'payload': payload,
      'createdAt': DateTime.now().toUtc().toIso8601String(),
    });
  }

  Future<bool> isOnline() async {
    final connectivity = await Connectivity().checkConnectivity();
    return !connectivity.contains(ConnectivityResult.none);
  }

  Future<void> syncIfOnline() async {
    if (!await isOnline()) return;
    await _syncGps();
    await _syncActions();
  }

  Future<void> _syncGps() async {
    final box = HiveBoxes.gps;
    if (box.isEmpty) return;

    final byTrip = <String, List<GpsPoint>>{};
    for (final key in box.keys) {
      final value = box.get(key);
      if (value == null) continue;
      final point = GpsPoint.fromHive(value);
      byTrip.putIfAbsent(point.tripId, () => []).add(point);
    }

    for (final entry in byTrip.entries) {
      try {
        await _tracking.syncOffline(entry.key, entry.value);
        final keysToDelete = box.keys.where((k) {
          final v = box.get(k);
          return v != null && v['tripId'] == entry.key;
        }).toList();
        await box.deleteAll(keysToDelete);
      } catch (_) {
        for (final point in entry.value) {
          try {
            await _tracking.pushLocation(point);
          } catch (_) {}
        }
      }
    }
  }

  Future<void> _syncActions() async {
    final box = HiveBoxes.actions;
    final keys = box.keys.toList();
    for (final key in keys) {
      final item = box.get(key);
      if (item == null) continue;
      final type = item['type'] as String;
      final payload = Map<String, dynamic>.from(item['payload'] as Map);
      final tripId = payload['tripId'] as String;
      final studentId = payload['studentId'] as String?;

      try {
        if (type == 'student_picked' && studentId != null) {
          if (_socket.isConnected) {
            _socket.emitStudentPicked(tripId, studentId);
          }
          await _students.markPicked(tripId, studentId);
        } else if (type == 'student_dropped' && studentId != null) {
          if (_socket.isConnected) {
            _socket.emitStudentDropped(tripId, studentId);
          }
          await _students.markDropped(tripId, studentId);
        } else if (type == 'sos') {
          await _tracking.triggerSos(
            tripId: tripId,
            latitude: (payload['latitude'] as num?)?.toDouble(),
            longitude: (payload['longitude'] as num?)?.toDouble(),
            description: payload['description'] as String?,
          );
          if (_socket.isConnected) {
            _socket.emitSos(
              tripId: tripId,
              latitude: (payload['latitude'] as num?)?.toDouble(),
              longitude: (payload['longitude'] as num?)?.toDouble(),
              description: payload['description'] as String?,
            );
          }
        }
        await box.delete(key);
      } catch (_) {}
    }
  }
}
