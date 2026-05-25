import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../students/data/students_provider.dart';
import '../../../students/presentation/widgets/student_swipe_tile.dart';
import '../../../tracking/presentation/providers/active_trip_provider.dart';
import '../../data/trips_repository.dart';

class ActiveTripScreen extends ConsumerWidget {
  const ActiveTripScreen({super.key, required this.tripId});

  final String tripId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final students = ref.watch(tripStudentsProvider(tripId));
    final active = ref.watch(activeTripProvider);
    final isActive = active?.id == tripId;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Active trip'),
        actions: [
          IconButton(icon: const Icon(Icons.map), onPressed: () => context.push('map')),
          IconButton(
            icon: const Icon(Icons.warning_amber, color: Colors.red),
            onPressed: () => context.push('sos'),
          ),
        ],
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16),
        child: isActive
            ? FilledButton(
                style: FilledButton.styleFrom(backgroundColor: Colors.red),
                onPressed: () async {
                  await ref.read(activeTripProvider.notifier).stopTrip();
                  if (context.mounted) context.go('/');
                },
                child: const Text('Stop trip'),
              )
            : FilledButton(
                onPressed: () async {
                  final trip = await ref.read(tripsRepositoryProvider).getTrip(tripId);
                  await ref.read(activeTripProvider.notifier).startTrip(trip);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Trip started — GPS tracking active')),
                    );
                  }
                },
                child: const Text('Start trip'),
              ),
      ),
      body: students.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (list) => ListView.builder(
          itemCount: list.length,
          itemBuilder: (_, i) {
            final s = list[i];
            return StudentSwipeTile(
              student: s,
              onPicked: () => ref.read(studentActionsProvider.notifier).markPicked(tripId, s.studentId),
              onDropped: () => ref.read(studentActionsProvider.notifier).markDropped(tripId, s.studentId),
            );
          },
        ),
      ),
    );
  }
}
