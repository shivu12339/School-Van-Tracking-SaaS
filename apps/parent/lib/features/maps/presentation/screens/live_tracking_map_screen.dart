import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../../students/domain/entities/child.dart';
import '../../../tracking/presentation/providers/live_tracking_provider.dart';
import '../../../../shared/widgets/eta_card.dart';
import '../../../tracking/presentation/widgets/student_status_timeline.dart';
import 'package:go_router/go_router.dart';
import '../widgets/animated_van_marker.dart';
import '../../../../services/analytics/analytics_service.dart';

class LiveTrackingMapScreen extends ConsumerStatefulWidget {
  const LiveTrackingMapScreen({super.key, required this.child});

  final Child child;

  @override
  ConsumerState<LiveTrackingMapScreen> createState() => _LiveTrackingMapScreenState();
}

class _LiveTrackingMapScreenState extends ConsumerState<LiveTrackingMapScreen> {
  GoogleMapController? _mapController;
  final _animator = AnimatedVanMarkerController();
  LatLng? _vanPos;
  Set<Polyline> _polylines = {};

  @override
  void initState() {
    super.initState();
    ref.read(analyticsProvider).screen('live_tracking_map');
    _animator.onUpdate = (pos) {
      setState(() => _vanPos = pos);
      _mapController?.animateCamera(CameraUpdate.newLatLng(pos));
    };
  }

  @override
  void dispose() {
    _animator.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tracking = ref.watch(liveTrackingProvider(widget.child));

    final loc = tracking.vanLocation;
    if (loc != null) {
      _animator.updateTarget(loc.latitude, loc.longitude);
    }

    final home = widget.child.homeLatitude != null && widget.child.homeLongitude != null
        ? LatLng(widget.child.homeLatitude!, widget.child.homeLongitude!)
        : null;

    final center = _vanPos ?? home ?? const LatLng(12.9716, 77.5946);

    final markers = <Marker>{
      if (_vanPos != null)
        Marker(
          markerId: const MarkerId('van'),
          position: _vanPos!,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
          infoWindow: InfoWindow(title: tracking.vanPlate ?? 'School van'),
        ),
      if (home != null)
        Marker(
          markerId: const MarkerId('home'),
          position: home,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
          infoWindow: const InfoWindow(title: 'Home'),
        ),
    };

    if (home != null && _vanPos != null) {
      _polylines = {
        Polyline(
          polylineId: const PolylineId('route'),
          points: [_vanPos!, home],
          color: Colors.blue,
          width: 4,
        ),
      };
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Tracking ${widget.child.fullName}'),
        actions: [
          if (tracking.driverProfile != null)
            IconButton(
              icon: const Icon(Icons.person_outline),
              onPressed: () => context.push('/child/${widget.child.id}/driver'),
            ),
          if (!tracking.connected)
            const Padding(
              padding: EdgeInsets.only(right: 12),
              child: Icon(Icons.cloud_off, color: Colors.orange),
            ),
        ],
      ),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(target: center, zoom: 14),
            markers: markers,
            polylines: _polylines,
            myLocationButtonEnabled: true,
            onMapCreated: (c) => _mapController = c,
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (tracking.tripStudentStatus != null)
                  StudentStatusTimeline(
                    status: tracking.tripStudentStatus!,
                    pickedAt: tracking.pickedAt,
                    droppedAt: tracking.droppedAt,
                  ),
                const SizedBox(height: 8),
                EtaCard(eta: tracking.eta, connected: tracking.connected),
                if (tracking.fromCache)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      'Last known position (offline)',
                      style: Theme.of(context).textTheme.bodySmall,
                      textAlign: TextAlign.center,
                    ),
                  ),
              ],
            ),
          ),
          if (tracking.loading)
            const ColoredBox(
              color: Colors.black26,
              child: Center(child: CircularProgressIndicator()),
            ),
          if (!tracking.loading && !tracking.hasActiveTrip)
            const Center(
              child: Card(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('No active trip right now'),
                ),
              ),
            ),
        ],
      ),
      floatingActionButton: tracking.driverPhone != null
          ? FloatingActionButton.extended(
              onPressed: () => _showEmergency(context, tracking),
              icon: const Icon(Icons.phone),
              label: const Text('Contact driver'),
            )
          : null,
    );
  }

}
