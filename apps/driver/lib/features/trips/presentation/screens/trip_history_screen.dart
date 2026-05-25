import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../data/trips_repository.dart';
import '../../domain/entities/trip.dart';

final tripHistoryProvider = FutureProvider<List<Trip>>((ref) {
  return ref.watch(tripsRepositoryProvider).getHistory();
});

class TripHistoryScreen extends ConsumerWidget {
  const TripHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(tripHistoryProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Trip history')),
      body: history.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (trips) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: trips.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (_, i) {
            final t = trips[i];
            return ListTile(
              tileColor: Theme.of(context).cardColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              title: Text(t.routeName ?? 'Trip'),
              subtitle: Text(DateFormat.yMMMd().format(t.tripDate)),
              trailing: Text(t.status),
            );
          },
        ),
      ),
    );
  }
}
