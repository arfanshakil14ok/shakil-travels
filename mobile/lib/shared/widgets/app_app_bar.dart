import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';
import '../../app/theme/app_spacing.dart';

/// SHAKIL TRAVELS Standardized App Bar
/// Enforces brand identity, touch target sizing, and typography across all screens.
class AppAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final String? subtitle;
  final Widget? titleWidget;
  final List<Widget>? actions;
  final Widget? leading;
  final bool showBackButton;
  final VoidCallback? onBackPressed;
  final Color backgroundColor;
  final Color foregroundColor;
  final bool centerTitle;
  final PreferredSizeWidget? bottom;
  final double elevation;

  const AppAppBar({
    super.key,
    required this.title,
    this.subtitle,
    this.titleWidget,
    this.actions,
    this.leading,
    this.showBackButton = true,
    this.onBackPressed,
    this.backgroundColor = AppColors.corporateNavy,
    this.foregroundColor = AppColors.surfaceWhite,
    this.centerTitle = false,
    this.bottom,
    this.elevation = 0,
  });

  /// Factory for a clean white AppBar (often used in modal screens or forms)
  factory AppAppBar.white({
    Key? key,
    required String title,
    String? subtitle,
    Widget? titleWidget,
    List<Widget>? actions,
    Widget? leading,
    bool showBackButton = true,
    VoidCallback? onBackPressed,
    PreferredSizeWidget? bottom,
  }) {
    return AppAppBar(
      key: key,
      title: title,
      subtitle: subtitle,
      titleWidget: titleWidget,
      actions: actions,
      leading: leading,
      showBackButton: showBackButton,
      onBackPressed: onBackPressed,
      backgroundColor: AppColors.surfaceWhite,
      foregroundColor: AppColors.corporateNavy,
      bottom: bottom,
      elevation: 0.5,
    );
  }

  @override
  Widget build(BuildContext context) {
    final canPop = ModalRoute.of(context)?.canPop ?? false;

    Widget? effectiveLeading = leading;
    if (effectiveLeading == null && showBackButton && canPop) {
      effectiveLeading = IconButton(
        icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
        color: foregroundColor,
        tooltip: 'Back',
        onPressed: onBackPressed ?? () => Navigator.of(context).maybePop(),
      );
    }

    Widget effectiveTitle = titleWidget ??
        Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: centerTitle
              ? CrossAxisAlignment.center
              : CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                color: foregroundColor,
                fontSize: 17,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.2,
              ),
              overflow: TextOverflow.ellipsis,
            ),
            if (subtitle != null && subtitle!.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                subtitle!,
                style: TextStyle(
                  color: foregroundColor.withValues(alpha: 0.8),
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        );

    return AppBar(
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      elevation: elevation,
      scrolledUnderElevation: elevation > 0 ? elevation : 1.0,
      centerTitle: centerTitle,
      leading: effectiveLeading,
      title: effectiveTitle,
      actions: actions != null
          ? [
              ...actions!,
              const SizedBox(width: AppSpacing.xs),
            ]
          : null,
      bottom: bottom,
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(
        kToolbarHeight + (bottom?.preferredSize.height ?? 0.0),
      );
}
