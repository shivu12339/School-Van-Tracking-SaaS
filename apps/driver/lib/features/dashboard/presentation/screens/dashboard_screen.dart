import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../trips/data/trips_repository.dart';
import '../../../trips/domain/entities/trip.dart';
import '../../../tracking/presentation/providers/active_trip_provider.dart';
import '../../../../services/socket/tracking_socket_manager.dart';

final todayTripsProvider = FutureProvider<List<Trip>>((ref) {
  return ref.watch(tripsRepositoryProvider).getTodayTrips();
});

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).value;
    final trips = ref.watch(todayTripsProvider);
    final active = ref.watch(activeTripProvider);
    final socket = ref.watch(trackingSocketProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Today\'s trips'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () => context.push('/history'),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authStateProvider.notifier).logout(),
          ),
        ],
      ),
      body: Column(
        children: [
          if (active != null)
            MaterialBanner(
              content: Text('Active trip: ${active.routeName ?? active.id.substring(0, 8)}'),
              actions: [
                TextButton(
                  onPressed: () => context.push('/trip/${active.id}'),
                  child: const Text('Open'),
                ),
              ],
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(
                  socket.isConnected ? Icons.wifi : Icons.wifi_off,
                  color: socket.isConnected ? Colors.green : Colors.orange,
                ),
                const SizedBox(width: 8),
                Text(socket.isConnected ? 'Realtime connected' : 'Realtime offline'),
                const Spacer(),
                Text(user?.firstName ?? ''),
              ],
            ),
          ),
          Expanded(
            child: trips.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (items) => ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) {
                  final trip = items[i];
                  return Card(
                    child: ListTile(
                      title: Text(trip.routeName ?? 'Trip'),
                      subtitle: Text('${trip.status} · ${trip.studentCount} students'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.push('/trip/${trip.id}'),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
