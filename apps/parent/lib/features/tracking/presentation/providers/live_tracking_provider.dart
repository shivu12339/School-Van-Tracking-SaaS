import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../notifications/presentation/providers/notifications_provider.dart';
import '../../../students/data/parent_repository.dart';
import '../../../students/domain/entities/child.dart';
import '../../../driver/domain/entities/driver_profile.dart';
import '../../../../services/local/parent_cache.dart';
import '../../../../services/socket/parent_socket_manager.dart';
import '../../domain/entities/van_location.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class LiveTrackingState {
  const LiveTrackingState({
    this.child,
    this.tripId,
    this.vanLocation,
    this.eta,
    this.tripStudentStatus,
    this.connected = false,
    this.driverProfile,
    this.loading = true,
    this.hasActiveTrip = false,
    this.pickedAt,
    this.droppedAt,
    this.fromCache = false,
  });

  final Child? child;
  final String? tripId;
  final VanLocation? vanLocation;
  final EtaInfo? eta;
  final String? tripStudentStatus;
  final bool connected;
  final DriverProfile? driverProfile;
  final bool loading;
  final bool hasActiveTrip;
  final DateTime? pickedAt;
  final DateTime? droppedAt;
  final bool fromCache;

  LiveTrackingState copyWith({
    VanLocation? vanLocation,
    EtaInfo? eta,
    String? tripStudentStatus,
    bool? connected,
    bool? loading,
    bool? hasActiveTrip,
    DriverProfile? driverProfile,
    DateTime? pickedAt,
    DateTime? droppedAt,
    bool? fromCache,
  }) =>
      LiveTrackingState(
        child: child,
        tripId: tripId,
        vanLocation: vanLocation ?? this.vanLocation,
        eta: eta ?? this.eta,
        tripStudentStatus: tripStudentStatus ?? this.tripStudentStatus,
        connected: connected ?? this.connected,
        driverProfile: driverProfile ?? this.driverProfile,
        loading: loading ?? this.loading,
        hasActiveTrip: hasActiveTrip ?? this.hasActiveTrip,
        pickedAt: pickedAt ?? this.pickedAt,
        droppedAt: droppedAt ?? this.droppedAt,
        fromCache: fromCache ?? this.fromCache,
      );
}

final liveTrackingProvider =
    StateNotifierProvider.family<LiveTrackingNotifier, LiveTrackingState, Child>((ref, child) {
  return LiveTrackingNotifier(ref, child);
});

class LiveTrackingNotifier extends StateNotifier<LiveTrackingState> {
  LiveTrackingNotifier(this._ref, Child child) : super(LiveTrackingState(child: child)) {
    _bootstrap();
  }

  final Ref _ref;
  final List<StreamSubscription<dynamic>> _subs = [];
  Timer? _etaPoll;

  Future<void> _bootstrap() async {
    final child = state.child!;
    final repo = _ref.read(parentRepositoryProvider);
    final socket = _ref.read(parentSocketProvider);
    final user = _ref.read(authStateProvider).value;

    Map<String, dynamic>? active;
    try {
      active = await repo.getActiveTrip(child.id);
    } catch (_) {
      active = ParentCache.getTripState(child.id);
      if (active != null) {
        state = _stateFromCache(child, active);
      }
    }

    if (active == null) {
      state = LiveTrackingState(child: child, loading: false, hasActiveTrip: false);
      return;
    }

    await ParentCache.cacheTripState(child.id, active);
    final profile = DriverProfile.fromActiveTrip(active);
    final trip = active['trip'] as Map<String, dynamic>;
    final tripId = trip['id'] as String;

    state = LiveTrackingState(
      child: child,
      tripId: tripId,
      tripStudentStatus: active['status'] as String?,
      pickedAt: _parseDate(active['pickupAt']),
      droppedAt: _parseDate(active['dropoffAt']),
      driverProfile: profile,
      hasActiveTrip: true,
      loading: false,
    );

    await socket.connect(tripId: tripId, schoolId: user?.schoolId);

    try {
      final live = await repo.getLive(tripId, child.id);
      final eta = await repo.getEta(tripId, child.id);
      state = state.copyWith(
        vanLocation: live,
        eta: eta,
        connected: socket.isConnected,
        fromCache: false,
      );
    } catch (_) {
      final cached = ParentCache.getTripState(child.id);
      if (cached != null) {
        state = _stateFromCache(child, cached).copyWith(connected: false, fromCache: true);
      }
    }

    _bindStreams(child.id, tripId, repo, socket);
    _startEtaPoll(tripId, child.id, repo);
  }

  LiveTrackingState _stateFromCache(Child child, Map<String, dynamic> active) {
    final trip = active['trip'] as Map<String, dynamic>? ?? active;
    return LiveTrackingState(
      child: child,
      tripId: trip['id'] as String?,
      tripStudentStatus: active['status'] as String?,
      driverProfile: DriverProfile.fromActiveTrip(active),
      hasActiveTrip: true,
      loading: false,
      fromCache: true,
    );
  }

  void _bindStreams(String studentId, String tripId, ParentRepository repo, ParentSocketManager socket) {
    _subs.add(socket.connectionStream.listen((c) async {
      state = state.copyWith(connected: c);
      if (c) {
        final live = await repo.getLive(tripId, studentId);
        final eta = await repo.getEta(tripId, studentId);
        state = state.copyWith(vanLocation: live, eta: eta, fromCache: false);
      }
    }));
    _subs.add(socket.vanStream.listen((loc) {
      state = state.copyWith(vanLocation: loc, fromCache: false);
    }));
    _subs.add(socket.etaStream.listen((e) {
      state = state.copyWith(eta: e);
    }));
    _subs.add(socket.tripStatusStream.listen((_) async {
      await _refreshOverview(tripId, studentId, repo);
    }));
    _subs.add(socket.studentStatusStream.listen((_) async {
      await _refreshOverview(tripId, studentId, repo);
    }));
    _subs.add(socket.notificationStream.listen((_) {
      _ref.invalidate(notificationsListProvider);
      _ref.invalidate(unreadCountProvider);
    }));
  }

  Future<void> _refreshOverview(String tripId, String studentId, ParentRepository repo) async {
    try {
      final overview = await repo.getTripOverview(tripId, studentId);
      await ParentCache.cacheTripState(studentId, overview);
      state = state.copyWith(
        tripStudentStatus: overview['status'] as String?,
        pickedAt: _parseDate(overview['pickupAt']),
        droppedAt: _parseDate(overview['dropoffAt']),
      );
    } catch (_) {}
  }

  void _startEtaPoll(String tripId, String studentId, ParentRepository repo) {
    _etaPoll?.cancel();
    _etaPoll = Timer.periodic(const Duration(seconds: 45), (_) async {
      if (!state.hasActiveTrip) return;
      try {
        final eta = await repo.getEta(tripId, studentId);
        if (eta != null) state = state.copyWith(eta: eta);
      } catch (_) {}
    });
  }

  static DateTime? _parseDate(dynamic v) {
    if (v == null) return null;
    return DateTime.tryParse(v.toString());
  }

  @override
  void dispose() {
    _etaPoll?.cancel();
    for (final s in _subs) {
      s.cancel();
    }
    _ref.read(parentSocketProvider).disconnect();
    super.dispose();
  }
}
