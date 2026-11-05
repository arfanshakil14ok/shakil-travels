import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';

/// Navigation item model for [AppBottomNavigation]
class AppBottomNavItem {
  final IconData icon;
  final IconData? activeIcon;
  final String label;
  final String? tooltip;
  final int? badgeCount;

  const AppBottomNavItem({
    required this.icon,
    this.activeIcon,
    required this.label,
    this.tooltip,
    this.badgeCount,
  });
}

/// SHAKIL TRAVELS Standardized Bottom Navigation Bar
/// Unifies bottom navigation across Candidate, Staff, and Admin portals.
class AppBottomNavigation extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<AppBottomNavItem> items;

  const AppBottomNavigation({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surfaceWhite,
        boxShadow: [
          BoxShadow(
            color: Color(0x0F000000),
            offset: Offset(0, -2),
            blurRadius: 8,
          ),
        ],
        border: Border(
          top: BorderSide(color: AppColors.cardBorder, width: 0.8),
        ),
      ),
      child: SafeArea(
        top: false,
        child: BottomNavigationBar(
          currentIndex: currentIndex,
          onTap: onTap,
          type: BottomNavigationBarType.fixed,
          backgroundColor: AppColors.surfaceWhite,
          selectedItemColor: AppColors.corporateNavy,
          unselectedItemColor: AppColors.textDisabled,
          selectedFontSize: 11,
          unselectedFontSize: 11,
          selectedLabelStyle: const TextStyle(
            fontWeight: FontWeight.w700,
            height: 1.3,
          ),
          unselectedLabelStyle: const TextStyle(
            fontWeight: FontWeight.w500,
            height: 1.3,
          ),
          elevation: 0,
          items: items.map((item) {
            Widget iconWidget = Icon(item.icon);
            Widget activeIconWidget = Icon(
              item.activeIcon ?? item.icon,
              color: AppColors.corporateNavy,
            );

            if (item.badgeCount != null && item.badgeCount! > 0) {
              final badgeLabel = item.badgeCount! > 99 ? '99+' : '${item.badgeCount}';
              iconWidget = Badge(
                label: Text(badgeLabel, style: const TextStyle(fontSize: 9)),
                backgroundColor: AppColors.error,
                child: iconWidget,
              );
              activeIconWidget = Badge(
                label: Text(badgeLabel, style: const TextStyle(fontSize: 9)),
                backgroundColor: AppColors.error,
                child: activeIconWidget,
              );
            }

            return BottomNavigationBarItem(
              icon: iconWidget,
              activeIcon: activeIconWidget,
              label: item.label,
              tooltip: item.tooltip ?? item.label,
            );
          }).toList(),
        ),
      ),
    );
  }
}
