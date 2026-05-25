import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../trips/domain/entities/trip.dart';
import '../../../trips/data/trips_repository.dart';
import '../../data/tracking_repository.dart';
import '../../../../services/location/background_location_service.dart';
import '../../../../services/location/location_tracking_service.dart';
import '../../../../services/local/hive_boxes.dart';
import '../../../../services/socket/tracking_socket_manager.dart';
import '../../../../services/sync/offline_sync_service.dart';
import '../../../../core/permissions/location_permissions.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

final activeTripProvider = StateNotifierProvider<ActiveTripNotifier, Trip?>((ref) {
  return ActiveTripNotifier(ref);
});

class ActiveTripNotifier extends StateNotifier<Trip?> {
  ActiveTripNotifier(this._ref) : super(null) {
    _restore();
  }

  final Ref _ref;

  Future<void> _restore() async {
    final tripId = HiveBoxes.trip.get('tripId') as String?;
    if (tripId == null) return;
    try {
      final trip = await _ref.read(tripsRepositoryProvider).getTrip(tripId);
      if (trip.status == 'IN_PROGRESS') {
        state = trip;
        final user = _ref.read(authStateProvider).value;
        final socket = _ref.read(trackingSocketProvider);
        final location = _ref.read(locationTrackingServiceProvider);
        await socket.connect(tripId: tripId, schoolId: user?.schoolId);
        await location.start(tripId);
        await BackgroundLocationService.start(tripId);
      } else {
        await HiveBoxes.trip.delete('tripId');
      }
    } catch (_) {
      await HiveBoxes.trip.delete('tripId');
    }
  }

  Future<void> startTrip(Trip trip) async {
    await LocationPermissions.ensureAll();
    final tracking = _ref.read(trackingRepositoryProvider);
    final socket = _ref.read(trackingSocketProvider);
    final location = _ref.read(locationTrackingServiceProvider);
    final user = _ref.read(authStateProvider).value;

    await tracking.startTrip(trip.id);
    await socket.connect(tripId: trip.id, schoolId: user?.schoolId);
    socket.emitTripStart(trip.id);
    await BackgroundLocationService.start(trip.id);
    await location.start(trip.id);
    await HiveBoxes.trip.put('tripId', trip.id);
    state = trip.copyWithStatus('IN_PROGRESS');
  }

  Future<void> stopTrip() async {
    if (state == null) return;
    final tripId = state!.id;
    final tracking = _ref.read(trackingRepositoryProvider);
    final socket = _ref.read(trackingSocketProvider);
    final location = _ref.read(locationTrackingServiceProvider);
    final offline = _ref.read(offlineSyncServiceProvider);

    socket.emitTripStop(tripId);
    await tracking.stopTrip(tripId);
    await location.stop();
    await BackgroundLocationService.stop();
    await socket.disconnect();
    await offline.syncIfOnline();
    await HiveBoxes.trip.delete('tripId');
    state = null;
  }
}

extension on Trip {
  Trip copyWithStatus(String status) => Trip(
        id: id,
        status: status,
        direction: direction,
        tripDate: tripDate,
        routeName: routeName,
        vanRegistration: vanRegistration,
        studentCount: studentCount,
      );
}
