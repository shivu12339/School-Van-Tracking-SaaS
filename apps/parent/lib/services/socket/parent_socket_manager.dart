import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../config/app_config.dart';
import '../../core/constants/socket_events.dart';
import '../../core/network/dio_client.dart';
import '../../features/auth/data/auth_token_storage.dart';
import '../../features/tracking/domain/entities/van_location.dart';

final parentSocketProvider = Provider((ref) {
  return ParentSocketManager(
    config: ref.watch(appConfigProvider),
    storage: ref.watch(authTokenStorageProvider),
  );
});

class ParentSocketManager {
  ParentSocketManager({required AppConfig config, required AuthTokenStorage storage})
      : _config = config,
        _storage = storage;

  final AppConfig _config;
  final AuthTokenStorage _storage;
  io.Socket? _socket;
  Timer? _heartbeat;

  bool get isConnected => _socket?.connected ?? false;

  final _vanController = StreamController<VanLocation>.broadcast();
  final _etaController = StreamController<EtaInfo>.broadcast();
  final _tripStatusController = StreamController<Map<String, dynamic>>.broadcast();
  final _studentStatusController = StreamController<Map<String, dynamic>>.broadcast();
  final _notificationController = StreamController<Map<String, dynamic>>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();

  Stream<VanLocation> get vanStream => _vanController.stream;
  Stream<EtaInfo> get etaStream => _etaController.stream;
  Stream<Map<String, dynamic>> get tripStatusStream => _tripStatusController.stream;
  Stream<Map<String, dynamic>> get studentStatusStream => _studentStatusController.stream;
  Stream<Map<String, dynamic>> get notificationStream => _notificationController.stream;
  Stream<bool> get connectionStream => _connectionController.stream;

  Future<void> connect({required String tripId, String? schoolId}) async {
    await disconnect();
    final token = await _storage.getAccessToken();
    if (token == null) return;

    _socket = io.io(
      '${_config.wsBaseUrl}${SocketEvents.namespace}',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .enableReconnection()
          .setReconnectionDelay(2000)
          .setAuth({'token': token, 'tripId': tripId, 'schoolId': schoolId})
          .build(),
    );

    _socket!
      ..onConnect((_) {
        _connectionController.add(true);
        _heartbeat?.cancel();
        _heartbeat = Timer.periodic(const Duration(seconds: 25), (_) {
          _socket?.emit('ping', {'ts': DateTime.now().toIso8601String()});
        });
      })
      ..onDisconnect((_) => _connectionController.add(false))
      ..onConnectError((_) => _connectionController.add(false))
      ..on(SocketEvents.vanLocation, (data) {
        if (data is Map) _vanController.add(VanLocation.fromJson(Map<String, dynamic>.from(data)));
      })
      ..on(SocketEvents.etaUpdate, (data) {
        if (data is Map) _etaController.add(EtaInfo.fromJson(Map<String, dynamic>.from(data)));
      })
      ..on(SocketEvents.tripStatus, (data) {
        if (data is Map) _tripStatusController.add(Map<String, dynamic>.from(data));
      })
      ..on(SocketEvents.studentPicked, (data) {
        if (data is Map) {
          _studentStatusController.add({...Map<String, dynamic>.from(data), 'event': 'picked'});
        }
      })
      ..on(SocketEvents.studentDropped, (data) {
        if (data is Map) {
          _studentStatusController.add({...Map<String, dynamic>.from(data), 'event': 'dropped'});
        }
      })
      ..on(SocketEvents.notificationNew, (data) {
        if (data is Map) _notificationController.add(Map<String, dynamic>.from(data));
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
    _vanController.close();
    _etaController.close();
    _tripStatusController.close();
    _studentStatusController.close();
    _notificationController.close();
    _connectionController.close();
  }
}
