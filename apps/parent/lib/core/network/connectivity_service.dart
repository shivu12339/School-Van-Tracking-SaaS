import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final connectivityProvider = StreamProvider<bool>((ref) {
  final controller = StreamController<bool>.broadcast();
  final connectivity = Connectivity();

  Future<void> emit() async {
    final results = await connectivity.checkConnectivity();
    controller.add(!results.contains(ConnectivityResult.none));
  }

  emit();
  final sub = connectivity.onConnectivityChanged.listen((results) {
    controller.add(!results.contains(ConnectivityResult.none));
  });

  ref.onDispose(() {
    sub.cancel();
    controller.close();
  });

  return controller.stream;
});
