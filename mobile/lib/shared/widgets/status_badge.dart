import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;
  final IconData? icon;

  const StatusBadge({
    super.key,
    required this.label,
    required this.backgroundColor,
    required this.textColor,
    this.icon,
  });

  factory StatusBadge.verified([String label = 'Verified']) {
    return StatusBadge(
      label: label,
      backgroundColor: AppColors.successLight,
      textColor: AppColors.success,
      icon: Icons.check_circle_rounded,
    );
  }

  factory StatusBadge.pending([String label = 'Pending']) {
    return StatusBadge(
      label: label,
      backgroundColor: AppColors.warningLight,
      textColor: AppColors.warning,
      icon: Icons.schedule_rounded,
    );
  }

  factory StatusBadge.rejected([String label = 'Action Required']) {
    return StatusBadge(
      label: label,
      backgroundColor: AppColors.errorLight,
      textColor: AppColors.error,
      icon: Icons.error_rounded,
    );
  }

  factory StatusBadge.processing([String label = 'Processing']) {
    return StatusBadge(
      label: label,
      backgroundColor: AppColors.lightPink,
      textColor: AppColors.deepNavy,
      icon: Icons.sync_rounded,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: textColor,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
