import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/students/presentation/providers/children_provider.dart';

final connectivityWatcherProvider = Provider<ConnectivityWatcher>((ref) {
  final watcher = ConnectivityWatcher(ref);
  ref.onDispose(watcher.dispose);
  return watcher;
});

class ConnectivityWatcher {
  ConnectivityWatcher(this._ref);

  final Ref _ref;
  StreamSubscription<List<ConnectivityResult>>? _sub;

  void start() {
    _sub?.cancel();
    _sub = Connectivity().onConnectivityChanged.listen((results) {
      if (!results.contains(ConnectivityResult.none)) {
        _ref.invalidate(childrenProvider);
      }
    });
  }

  void dispose() => _sub?.cancel();
}
