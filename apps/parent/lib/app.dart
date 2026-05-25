import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/lifecycle/app_lifecycle_handler.dart';
import 'routes/app_router.dart';
import 'shared/widgets/connection_banner.dart';
import 'services/deep_link/deep_link_service.dart';
import 'services/notifications/fcm_service.dart';
import 'shared/theme/app_theme.dart';

class SchoolVanParentApp extends ConsumerStatefulWidget {
  const SchoolVanParentApp({super.key});

  @override
  ConsumerState<SchoolVanParentApp> createState() => _SchoolVanParentAppState();
}

class _SchoolVanParentAppState extends ConsumerState<SchoolVanParentApp> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final router = ref.read(appRouterProvider);
      ref.read(fcmServiceProvider).bindRouter(router);
      await ref.read(deepLinkServiceProvider).init(router);
    });
  }

  @override
  void dispose() {
    ref.read(deepLinkServiceProvider).dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);
    return AppLifecycleHandler(
      child: MaterialApp.router(
        title: 'School Van Parent',
        theme: AppTheme.light(),
        routerConfig: router,
        debugShowCheckedModeBanner: false,
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [Locale('en')],
        builder: (context, child) => ConnectionBanner(child: child ?? const SizedBox()),
      ),
    );
  }
}
