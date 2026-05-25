import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../tracking/data/tracking_repository.dart';
import '../../../../services/local/hive_boxes.dart';
import '../../../../services/socket/tracking_socket_manager.dart';
import '../../../../services/sync/offline_sync_service.dart';
import 'package:uuid/uuid.dart';

final sosNotifierProvider = StateNotifierProvider<SosNotifier, AsyncValue<void>>((ref) {
  return SosNotifier(ref);
});

class SosNotifier extends StateNotifier<AsyncValue<void>> {
  SosNotifier(this._ref) : super(const AsyncValue.data(null));

  final Ref _ref;
  static const _uuid = Uuid();

  Future<void> trigger({
    required String tripId,
    String description = 'Driver SOS',
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final pos = await Geolocator.getCurrentPosition();
      final socket = _ref.read(trackingSocketProvider);
      final tracking = _ref.read(trackingRepositoryProvider);
      final offline = _ref.read(offlineSyncServiceProvider);

      if (socket.isConnected) {
        socket.emitSos(
          tripId: tripId,
          latitude: pos.latitude,
          longitude: pos.longitude,
          description: description,
        );
      }

      if (await offline.isOnline()) {
        await tracking.triggerSos(
          tripId: tripId,
          latitude: pos.latitude,
          longitude: pos.longitude,
          description: description,
        );
      } else {
        await HiveBoxes.actions.put(_uuid.v4(), {
          'type': 'sos',
          'payload': {
            'tripId': tripId,
            'latitude': pos.latitude,
            'longitude': pos.longitude,
            'description': description,
          },
          'createdAt': DateTime.now().toUtc().toIso8601String(),
        });
      }
    });
  }
}
