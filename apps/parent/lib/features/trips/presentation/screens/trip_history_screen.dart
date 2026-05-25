import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../students/data/parent_repository.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';

final tripHistoryProvider = FutureProvider.autoDispose.family<List<Map<String, dynamic>>, String>((ref, studentId) {
  return ref.watch(parentRepositoryProvider).getTripHistory(studentId);
});

class TripHistoryScreen extends ConsumerWidget {
  const TripHistoryScreen({super.key, required this.studentId});

  final String studentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(tripHistoryProvider(studentId));

    return Scaffold(
      appBar: AppBar(title: const Text('Trip history')),
      body: history.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(tripHistoryProvider(studentId)),
        ),
        data: (trips) {
          if (trips.isEmpty) return const Center(child: Text('No past trips'));
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: trips.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final row = trips[i];
              final trip = row['trip'] as Map<String, dynamic>? ?? {};
              final date = trip['tripDate'] != null ? DateTime.tryParse(trip['tripDate'] as String) : null;
              final tripId = trip['id'] as String?;
              return Card(
                child: ListTile(
                  title: Text(trip['route']?['routeName'] as String? ?? 'Trip'),
                  subtitle: Text(
                    [
                      if (date != null) DateFormat.yMMMd().format(date),
                      row['status'] as String?,
                    ].whereType<String>().join(' • '),
                  ),
                  trailing: const Icon(Icons.play_circle_outline),
                  onTap: tripId == null
                      ? null
                      : () => context.push('/child/$studentId/trip/$tripId/playback'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
