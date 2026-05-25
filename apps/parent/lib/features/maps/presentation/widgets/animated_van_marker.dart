import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

/// Smoothly interpolates van position between socket updates (battery-friendly).
class AnimatedVanMarkerController {
  LatLng? _display;
  LatLng? _target;
  Timer? _timer;
  void Function(LatLng position)? onUpdate;

  LatLng? get position => _display;

  void updateTarget(double lat, double lng) {
    _target = LatLng(lat, lng);
    if (_display == null) {
      _display = _target;
      onUpdate?.call(_display!);
      return;
    }
    _timer?.cancel();
    const steps = 8;
    var step = 0;
    final start = _display!;
    final end = _target!;
    _timer = Timer.periodic(const Duration(milliseconds: 120), (t) {
      step++;
      final tVal = step / steps;
      _display = LatLng(
        start.latitude + (end.latitude - start.latitude) * tVal,
        start.longitude + (end.longitude - start.longitude) * tVal,
      );
      onUpdate?.call(_display!);
      if (step >= steps) {
        t.cancel();
        _display = end;
      }
    });
  }

  void dispose() => _timer?.cancel();
}
