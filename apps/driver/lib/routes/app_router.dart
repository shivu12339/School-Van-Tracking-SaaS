import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/providers/auth_provider.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../features/trips/presentation/screens/trip_history_screen.dart';
import '../features/trips/presentation/screens/active_trip_screen.dart';
import '../features/maps/presentation/screens/trip_map_screen.dart';
import '../features/sos/presentation/screens/sos_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authStateProvider);
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final user = auth.valueOrNull;
      final loggingIn = state.matchedLocation == '/login';
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
          GoRoute(
            path: 'trip/:tripId',
            builder: (_, state) => ActiveTripScreen(tripId: state.pathParameters['tripId']!),
            routes: [
              GoRoute(
                path: 'map',
                builder: (_, state) => TripMapScreen(tripId: state.pathParameters['tripId']!),
              ),
              GoRoute(
                path: 'sos',
                builder: (_, state) => SosScreen(tripId: state.pathParameters['tripId']!),
              ),
            ],
          ),
          GoRoute(path: 'history', builder: (_, __) => const TripHistoryScreen()),
        ],
      ),
    ],
  );
});
