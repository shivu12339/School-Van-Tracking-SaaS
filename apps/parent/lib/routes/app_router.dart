import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/providers/auth_provider.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../features/driver/presentation/screens/driver_profile_screen.dart';
import '../features/maps/presentation/screens/live_tracking_map_screen.dart';
import '../features/students/presentation/screens/child_detail_screen.dart';
import '../features/tracking/presentation/providers/live_tracking_provider.dart';
import '../features/notifications/presentation/screens/notifications_screen.dart';
import '../features/settings/presentation/screens/settings_screen.dart';
import '../features/students/domain/entities/child.dart';
import '../features/students/presentation/providers/children_provider.dart';
import '../features/trips/presentation/screens/trip_history_screen.dart';
import '../features/trips/presentation/screens/trip_playback_screen.dart';

final _rootKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authStateProvider);

  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: '/login',
    redirect: (context, state) {
      final user = auth.valueOrNull;
      final loggingIn = state.matchedLocation == '/login';
      if (auth.isLoading) return null;
      if (user == null && !loggingIn) return '/login';
      if (user != null && loggingIn) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: '/',
        builder: (_, __) => const DashboardScreen(),
        routes: [
          GoRoute(path: 'notifications', builder: (_, __) => const NotificationsScreen()),
          GoRoute(path: 'settings', builder: (_, __) => const SettingsScreen()),
          GoRoute(
            path: 'child/:studentId',
            builder: (_, state) => _ChildDetailLoader(studentId: state.pathParameters['studentId']!),
            routes: [
              GoRoute(
                path: 'track',
                builder: (_, state) => _ChildTrackLoader(studentId: state.pathParameters['studentId']!),
              ),
              GoRoute(
                path: 'driver',
                builder: (_, state) => _DriverProfileLoader(studentId: state.pathParameters['studentId']!),
              ),
              GoRoute(
                path: 'history',
                builder: (_, state) => TripHistoryScreen(studentId: state.pathParameters['studentId']!),
              ),
              GoRoute(
                path: 'trip/:tripId/playback',
                builder: (_, state) => TripPlaybackScreen(
                  studentId: state.pathParameters['studentId']!,
                  tripId: state.pathParameters['tripId']!,
                ),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

class _ChildDetailLoader extends ConsumerWidget {
  const _ChildDetailLoader({required this.studentId});
  final String studentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final children = ref.watch(childrenProvider);
    return children.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(body: Center(child: Text(e.toString()))),
      data: (list) {
        Child? child;
        for (final c in list) {
          if (c.id == studentId) {
            child = c;
            break;
          }
        }
        if (child == null) return const Scaffold(body: Center(child: Text('Child not found')));
        return ChildDetailScreen(child: child);
      },
    );
  }
}

class _DriverProfileLoader extends ConsumerWidget {
  const _DriverProfileLoader({required this.studentId});
  final String studentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final children = ref.watch(childrenProvider);
    return children.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(body: Center(child: Text(e.toString()))),
      data: (list) {
        Child? child;
        for (final c in list) {
          if (c.id == studentId) {
            child = c;
            break;
          }
        }
        if (child == null) return const Scaffold(body: Center(child: Text('Child not found')));
        final tracking = ref.watch(liveTrackingProvider(child));
        final profile = tracking.driverProfile;
        if (profile == null) {
          return const Scaffold(body: Center(child: Text('No active trip — driver info unavailable')));
        }
        return DriverProfileScreen(profile: profile);
      },
    );
  }
}

class _ChildTrackLoader extends ConsumerWidget {
  const _ChildTrackLoader({required this.studentId});
  final String studentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final children = ref.watch(childrenProvider);
    return children.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(body: Center(child: Text(e.toString()))),
      data: (list) {
        Child? child;
        for (final c in list) {
          if (c.id == studentId) {
            child = c;
            break;
          }
        }
        if (child == null) return const Scaffold(body: Center(child: Text('Child not found')));
        return LiveTrackingMapScreen(child: child);
      },
    );
  }
}
