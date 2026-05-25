import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../sync/offline_sync_service.dart';

final connectivityWatcherProvider = Provider<ConnectivityWatcher>((ref) {
  final watcher = ConnectivityWatcher(ref.watch(offlineSyncServiceProvider));
  ref.onDispose(watcher.dispose);
  return watcher;
});

class ConnectivityWatcher {
  ConnectivityWatcher(this._offline);

  final OfflineSyncService _offline;
  StreamSubscription<List<ConnectivityResult>>? _sub;

  void start() {
    _sub?.cancel();
    _sub = Connectivity().onConnectivityChanged.listen((results) {
      if (!results.contains(ConnectivityResult.none)) {
        _offline.syncIfOnline();
      }
    });
  }

  void dispose() {
    _sub?.cancel();
  }
}
