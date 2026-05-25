import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.label, this.color});

  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? _colorForStatus(label);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label.replaceAll('_', ' '),
        style: TextStyle(color: c, fontWeight: FontWeight.w600, fontSize: 12),
      ),
    );
  }

  Color _colorForStatus(String s) {
    final upper = s.toUpperCase();
    if (upper.contains('PICKED') || upper.contains('ONBOARD')) return AppColors.success;
    if (upper.contains('DROPPED') || upper.contains('COMPLETED')) return AppColors.primary;
    if (upper.contains('PENDING') || upper.contains('WAITING')) return AppColors.warning;
    return AppColors.textSecondary;
  }
}
