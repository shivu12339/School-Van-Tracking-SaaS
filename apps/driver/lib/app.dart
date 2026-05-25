import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/lifecycle/app_lifecycle_handler.dart';
import 'routes/app_router.dart';
import 'shared/theme/app_theme.dart';
import 'shared/widgets/connection_banner.dart';

class SchoolVanDriverApp extends ConsumerWidget {
  const SchoolVanDriverApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    return AppLifecycleHandler(
      child: MaterialApp.router(
        title: 'School Van Driver',
        theme: AppTheme.light(),
        routerConfig: router,
        debugShowCheckedModeBanner: false,
        builder: (context, child) => ConnectionBanner(child: child ?? const SizedBox()),
      ),
    );
  }
}
