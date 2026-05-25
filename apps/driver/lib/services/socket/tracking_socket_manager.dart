import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../config/app_config.dart';
import '../../core/constants/socket_events.dart';
import '../../features/auth/data/auth_token_storage.dart';
import '../../features/tracking/domain/entities/gps_point.dart';

final trackingSocketProvider = Provider<TrackingSocketManager>((ref) {
  return TrackingSocketManager(
    config: ref.watch(appConfigProvider),
    storage: ref.watch(authTokenStorageProvider),
  );
});

class TrackingSocketManager {
  TrackingSocketManager({required AppConfig config, required AuthTokenStorage storage})
      : _config = config,
        _storage = storage;

  final AppConfig _config;
  final AuthTokenStorage _storage;
  io.Socket? _socket;
  Timer? _heartbeat;
  int _reconnectAttempt = 0;

  final _connectionController = StreamController<bool>.broadcast();
  Stream<bool> get connectionStream => _connectionController.stream;

  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect({required String tripId, String? schoolId}) async {
    await disconnect();
    final token = await _storage.getAccessToken();
    if (token == null) return;

    _socket = io.io(
      '${_config.wsBaseUrl}${SocketEvents.namespace}',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionDelay(2000)
          .setReconnectionDelayMax(30000)
          .setAuth({'token': token, 'tripId': tripId, 'schoolId': schoolId})
          .build(),
    );

    _socket!
      ..onConnect((_) {
        _reconnectAttempt = 0;
        _connectionController.add(true);
        _startHeartbeat();
      })
      ..onDisconnect((_) {
        _connectionController.add(false);
        _heartbeat?.cancel();
      })
      ..onConnectError((_) => _scheduleReconnect())
      ..on(SocketEvents.serverConnected, (_) => _connectionController.add(true));
  }

  void _startHeartbeat() {
    _heartbeat?.cancel();
    _heartbeat = Timer.periodic(const Duration(seconds: 25), (_) {
      _socket?.emit('ping', {'ts': DateTime.now().toIso8601String()});
    });
  }

  void _scheduleReconnect() {
    _reconnectAttempt += 1;
    final delay = Duration(seconds: (2 * _reconnectAttempt).clamp(2, 30));
    Future.delayed(delay, () => _socket?.connect());
  }

  void emitTrackingUpdate(GpsPoint point) {
    _socket?.emit(SocketEvents.trackingUpdate, {
      'tripId': point.tripId,
      'latitude': point.latitude,
      'longitude': point.longitude,
      'speed': point.speed,
      'heading': point.heading,
      'accuracy': point.accuracy,
      'timestamp': point.timestamp.toUtc().toIso8601String(),
    });
  }

  void emitTripStart(String tripId) {
    _socket?.emit(SocketEvents.tripStart, {'tripId': tripId});
  }

  void emitTripStop(String tripId) {
    _socket?.emit(SocketEvents.tripStop, {'tripId': tripId});
  }

  void emitStudentPicked(String tripId, String studentId) {
    _socket?.emit(SocketEvents.studentPicked, {'tripId': tripId, 'studentId': studentId});
  }

  void emitStudentDropped(String tripId, String studentId) {
    _socket?.emit(SocketEvents.studentDropped, {'tripId': tripId, 'studentId': studentId});
  }

  void emitSos({
    required String tripId,
    double? latitude,
    double? longitude,
    String? description,
  }) {
    _socket?.emit(SocketEvents.sosTriggered, {
      'tripId': tripId,
      'latitude': latitude,
      'longitude': longitude,
      'description': description,
    });
  }

  Future<void> disconnect() async {
    _heartbeat?.cancel();
    _socket?.dispose();
    _socket = null;
    _connectionController.add(false);
  }

  void dispose() {
    disconnect();
    _connectionController.close();
  }
}
