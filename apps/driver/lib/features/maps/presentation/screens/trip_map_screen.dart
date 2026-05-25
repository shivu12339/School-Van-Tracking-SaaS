import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../../../students/data/students_provider.dart';

class TripMapScreen extends ConsumerStatefulWidget {
  const TripMapScreen({super.key, required this.tripId});

  final String tripId;

  @override
  ConsumerState<TripMapScreen> createState() => _TripMapScreenState();
}

class _TripMapScreenState extends ConsumerState<TripMapScreen> {
  GoogleMapController? _controller;
  LatLng? _current;
  StreamSubscription<Position>? _positionSub;

  @override
  void initState() {
    super.initState();
    _loadPosition();
    _positionSub = Geolocator.getPositionStream().listen((pos) {
      setState(() => _current = LatLng(pos.latitude, pos.longitude));
    });
  }

  @override
  void dispose() {
    _positionSub?.cancel();
    super.dispose();
  }

  Future<void> _loadPosition() async {
    final pos = await Geolocator.getCurrentPosition();
    setState(() => _current = LatLng(pos.latitude, pos.longitude));
  }

  @override
  Widget build(BuildContext context) {
    final students = ref.watch(tripStudentsProvider(widget.tripId));
    final center = _current ?? const LatLng(12.9716, 77.5946);

    return Scaffold(
      appBar: AppBar(title: const Text('Live route')),
      body: students.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (list) {
          final stopPoints = <LatLng>[];
          final markers = <Marker>{};
          if (_current != null) {
            markers.add(
              Marker(
                markerId: const MarkerId('driver'),
                position: _current!,
                infoWindow: const InfoWindow(title: 'You'),
                icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
              ),
            );
            stopPoints.add(_current!);
          }
          for (final s in list) {
            if (s.latitude != null && s.longitude != null) {
              final latLng = LatLng(s.latitude!, s.longitude!);
              stopPoints.add(latLng);
              markers.add(
                Marker(
                  markerId: MarkerId(s.id),
                  position: latLng,
                  infoWindow: InfoWindow(title: s.fullName, snippet: s.status),
                ),
              );
            }
          }

          final polylines = stopPoints.length >= 2
              ? {
                  Polyline(
                    polylineId: const PolylineId('route'),
                    points: stopPoints,
                    color: Colors.blue,
                    width: 4,
                  ),
                }
              : <Polyline>{};

          return GoogleMap(
            initialCameraPosition: CameraPosition(target: center, zoom: 14),
            myLocationEnabled: true,
            myLocationButtonEnabled: true,
            markers: markers,
            polylines: polylines,
            onMapCreated: (c) => _controller = c,
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _controller?.animateCamera(CameraUpdate.newLatLng(center)),
        label: const Text('Recenter'),
        icon: const Icon(Icons.my_location),
      ),
    );
  }
}
