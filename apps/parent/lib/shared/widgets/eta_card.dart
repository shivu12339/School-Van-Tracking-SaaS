import 'package:flutter/material.dart';
import '../../features/tracking/domain/entities/van_location.dart';
import '../theme/design_tokens.dart';

class EtaCard extends StatelessWidget {
  const EtaCard({super.key, required this.eta, this.connected = true});

  final EtaInfo? eta;
  final bool connected;

  @override
  Widget build(BuildContext context) {
    final minutes = eta?.etaMinutes;
    final km = eta != null ? (eta!.distanceMeters / 1000).toStringAsFixed(1) : '—';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppRadii.md),
              ),
              child: const Icon(Icons.schedule, color: AppColors.primary),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    minutes != null ? '$minutes min ETA' : 'Calculating ETA…',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  Text('$km km away • ${connected ? 'Live' : 'Reconnecting…'}'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
