import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../../students/data/parent_repository.dart';
import '../../../../shared/widgets/loading_view.dart';

final playbackProvider = FutureProvider.autoDispose
    .family<List<Map<String, dynamic>>, ({String tripId, String studentId})>((ref, args) {
  return ref.watch(parentRepositoryProvider).getPlayback(args.tripId, args.studentId);
});

class TripPlaybackScreen extends ConsumerWidget {
  const TripPlaybackScreen({
    super.key,
    required this.tripId,
    required this.studentId,
  });

  final String tripId;
  final String studentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playback = ref.watch(playbackProvider((tripId: tripId, studentId: studentId)));

    return Scaffold(
      appBar: AppBar(title: const Text('Route playback')),
      body: playback.when(
        loading: () => const LoadingView(),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (points) {
          if (points.isEmpty) {
            return const Center(child: Text('No route data for this trip'));
          }
          final latLngs = points
              .map((p) => LatLng(
                    (p['latitude'] as num).toDouble(),
                    (p['longitude'] as num).toDouble(),
                  ))
              .toList();
          final polyline = Polyline(
            polylineId: const PolylineId('playback'),
            points: latLngs,
            color: Colors.blue,
            width: 4,
          );
          return GoogleMap(
            initialCameraPosition: CameraPosition(target: latLngs.first, zoom: 13),
            polylines: {polyline},
            markers: {
              Marker(markerId: const MarkerId('start'), position: latLngs.first),
              Marker(markerId: const MarkerId('end'), position: latLngs.last),
            },
          );
        },
      ),
    );
  }
}
