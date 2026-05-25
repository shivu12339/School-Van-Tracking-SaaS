import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/sos_provider.dart';

class SosScreen extends ConsumerStatefulWidget {
  const SosScreen({super.key, required this.tripId});

  final String tripId;

  @override
  ConsumerState<SosScreen> createState() => _SosScreenState();
}

class _SosScreenState extends ConsumerState<SosScreen> {
  Future<void> _trigger() async {
    await ref.read(sosNotifierProvider.notifier).trigger(tripId: widget.tripId);
    final state = ref.read(sosNotifierProvider);
    if (!mounted) return;
    state.whenOrNull(
      data: (_) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('SOS alert sent to admins')),
        );
        Navigator.pop(context);
      },
      error: (e, _) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('SOS failed: $e')),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final sending = ref.watch(sosNotifierProvider).isLoading;

    return Scaffold(
      appBar: AppBar(title: const Text('Emergency SOS')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.warning_amber, size: 80, color: Colors.red),
            const SizedBox(height: 24),
            const Text(
              'Trigger an emergency alert. School admins and parents will be notified immediately.',
              textAlign: TextAlign.center,
            ),
            const Spacer(),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: Colors.red),
              onPressed: sending ? null : _trigger,
              child: Text(sending ? 'Sending...' : 'Send SOS alert'),
            ),
          ],
        ),
      ),
    );
  }
}
