import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/students/presentation/providers/children_provider.dart';
import '../../features/notifications/presentation/providers/notifications_provider.dart';

/// Refreshes children and notification count when app returns to foreground.
class AppLifecycleHandler extends ConsumerStatefulWidget {
  const AppLifecycleHandler({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<AppLifecycleHandler> createState() => _AppLifecycleHandlerState();
}

class _AppLifecycleHandlerState extends ConsumerState<AppLifecycleHandler>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.invalidate(childrenProvider);
      ref.invalidate(unreadCountProvider);
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
