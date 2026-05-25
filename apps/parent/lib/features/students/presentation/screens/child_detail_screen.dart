import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../domain/entities/child.dart';
import '../../../tracking/presentation/providers/live_tracking_provider.dart';
import '../../../tracking/presentation/widgets/child_status_card.dart';
import '../../../tracking/presentation/widgets/student_status_timeline.dart';
import '../../../../shared/widgets/eta_card.dart';

/// Child hub: status timeline, ETA, and quick actions.
class ChildDetailScreen extends ConsumerWidget {
  const ChildDetailScreen({super.key, required this.child});

  final Child child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tracking = ref.watch(liveTrackingProvider(child));

    return Scaffold(
      appBar: AppBar(title: Text(child.fullName)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (tracking.fromCache)
            const Card(
              child: ListTile(
                leading: Icon(Icons.cloud_off, color: Colors.orange),
                title: Text('Offline mode'),
                subtitle: Text('Showing last saved trip data'),
              ),
            ),
          if (tracking.tripStudentStatus != null) ...[
            ChildStatusCard(
              childName: child.fullName,
              status: tracking.tripStudentStatus!,
              pickedAt: tracking.pickedAt,
              droppedAt: tracking.droppedAt,
            ),
            const SizedBox(height: 12),
            StudentStatusTimeline(
              status: tracking.tripStudentStatus!,
              pickedAt: tracking.pickedAt,
              droppedAt: tracking.droppedAt,
            ),
          ],
          const SizedBox(height: 12),
          EtaCard(eta: tracking.eta, connected: tracking.connected),
          const SizedBox(height: 16),
          if (tracking.hasActiveTrip) ...[
            FilledButton.icon(
              onPressed: () => context.push('/child/${child.id}/track'),
              icon: const Icon(Icons.map),
              label: const Text('Open live map'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: tracking.driverProfile != null
                  ? () => context.push('/child/${child.id}/driver')
                  : null,
              icon: const Icon(Icons.person),
              label: const Text('Driver & van details'),
            ),
            const SizedBox(height: 8),
          ],
          OutlinedButton.icon(
            onPressed: () => context.push('/child/${child.id}/history'),
            icon: const Icon(Icons.history),
            label: const Text('Trip history'),
          ),
        ],
      ),
    );
  }
}
