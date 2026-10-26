import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';

enum AppButtonVariant { primary, secondary, outline }

class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final AppButtonVariant variant;

  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.variant = AppButtonVariant.primary,
  });

  @override
  Widget build(BuildContext context) {
    if (variant == AppButtonVariant.outline) {
      return OutlinedButton(
        onPressed: isLoading ? null : onPressed,
        child: _buildChild(AppColors.corporateNavy),
      );
    }

    final bg = variant == AppButtonVariant.primary
        ? AppColors.corporateNavy
        : AppColors.corporatePink;
    final fg = variant == AppButtonVariant.primary
        ? AppColors.surfaceWhite
        : AppColors.deepNavy;

    return ElevatedButton(
      style: ElevatedButton.styleFrom(backgroundColor: bg, foregroundColor: fg),
      onPressed: isLoading ? null : onPressed,
      child: _buildChild(fg),
    );
  }

  Widget _buildChild(Color color) {
    if (isLoading) {
      return SizedBox(
        height: 20,
        width: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(color),
        ),
      );
    }

    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [Icon(icon, size: 18), const SizedBox(width: 8), Text(text)],
      );
    }

    return Text(text);
  }
}
