import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/socket/parent_socket_manager.dart';

class ConnectionBanner extends ConsumerWidget {
  const ConnectionBanner({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return StreamBuilder<bool>(
      stream: ref.watch(parentSocketProvider).connectionStream,
      initialData: ref.watch(parentSocketProvider).isConnected,
      builder: (context, snapshot) {
        final connected = snapshot.data ?? true;
        return Column(
          children: [
            if (!connected)
              Material(
                color: Colors.orange.shade800,
                child: SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        const Icon(Icons.cloud_off, color: Colors.white, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Reconnecting — showing last known van position',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            Expanded(child: child),
          ],
        );
      },
    );
  }
}
