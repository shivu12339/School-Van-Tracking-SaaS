import 'package:flutter/material.dart';
import '../../../../shared/theme/design_tokens.dart';

enum TripMilestone { waiting, picked, dropped, arrived }

class StudentStatusTimeline extends StatelessWidget {
  const StudentStatusTimeline({
    super.key,
    required this.status,
    this.pickedAt,
    this.droppedAt,
  });

  final String status;
  final DateTime? pickedAt;
  final DateTime? droppedAt;

  TripMilestone get _milestone {
    switch (status.toUpperCase()) {
      case 'PICKED':
        return TripMilestone.picked;
      case 'DROPPED':
        return TripMilestone.dropped;
      case 'ABSENT':
        return TripMilestone.waiting;
      default:
        return TripMilestone.waiting;
    }
  }

  @override
  Widget build(BuildContext context) {
    final steps = [
      _Step('Waiting for van', TripMilestone.waiting),
      _Step('Picked up', TripMilestone.picked),
      _Step('Dropped off', TripMilestone.dropped),
    ];
    final current = _milestone.index;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Trip progress', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            ...List.generate(steps.length, (i) {
              final done = i <= current;
              final active = i == current;
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Icon(
                        done ? Icons.check_circle : Icons.radio_button_unchecked,
                        color: done
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context).colorScheme.outline,
                        size: active ? 28 : 22,
                      ),
                      if (i < steps.length - 1)
                        Container(
                          width: 2,
                          height: 32,
                          color: done
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.outlineVariant,
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            steps[i].label,
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  fontWeight: active ? FontWeight.w600 : FontWeight.normal,
                                ),
                          ),
                          if (i == 1 && pickedAt != null)
                            Text(
                              _formatTime(pickedAt!),
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          if (i == 2 && droppedAt != null)
                            Text(
                              _formatTime(droppedAt!),
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            }),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime t) => t.toLocal().toString().substring(0, 16);
}

class _Step {
  const _Step(this.label, this.milestone);
  final String label;
  final TripMilestone milestone;
}
