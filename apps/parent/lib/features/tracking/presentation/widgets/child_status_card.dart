import 'package:flutter/material.dart';
import '../../../../shared/widgets/status_chip.dart';
import '../../../../shared/theme/design_tokens.dart';

class ChildStatusCard extends StatelessWidget {
  const ChildStatusCard({
    super.key,
    required this.childName,
    required this.status,
    this.pickedAt,
    this.droppedAt,
  });

  final String childName;
  final String status;
  final DateTime? pickedAt;
  final DateTime? droppedAt;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(childName, style: Theme.of(context).textTheme.titleLarge)),
                StatusChip(label: status),
              ],
            ),
            if (pickedAt != null) ...[
              const SizedBox(height: 8),
              Text('Picked up: ${pickedAt!.toLocal()}'),
            ],
            if (droppedAt != null) ...[
              const SizedBox(height: 4),
              Text('Dropped off: ${droppedAt!.toLocal()}'),
            ],
          ],
        ),
      ),
    );
  }
}
