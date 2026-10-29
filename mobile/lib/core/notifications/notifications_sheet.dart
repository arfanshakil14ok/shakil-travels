import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';
import 'notification_service.dart';

class NotificationsSheet extends StatelessWidget {
  final NotificationService notificationService;
  final ValueChanged<String>? onTrackingTap;

  const NotificationsSheet({
    super.key,
    required this.notificationService,
    this.onTrackingTap,
  });

  static void show(
    BuildContext context, {
    required NotificationService service,
    ValueChanged<String>? onTrackingTap,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => NotificationsSheet(
        notificationService: service,
        onTrackingTap: onTrackingTap,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: notificationService,
      builder: (context, _) {
        final items = notificationService.notifications;
        final unread = notificationService.unreadCount;

        return Container(
          height: MediaQuery.of(context).size.height * 0.72,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Handle Pill
              const SizedBox(height: 10),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 12),

              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.notifications_active_rounded,
                          color: AppColors.corporateNavy,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'নোটিফিকেশন সেন্টার',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppColors.corporateNavy,
                          ),
                        ),
                        if (unread > 0) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.corporatePink,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '$unread নতুন',
                              style: const TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (unread > 0)
                      TextButton(
                        onPressed: () => notificationService.markAllAsRead(),
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'সব পঠিত',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.corporatePinkHover,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const Divider(height: 20, color: Color(0xFFE2E8F0)),

              // Notification List
              Expanded(
                child: items.isEmpty
                    ? const Center(
                        child: Text(
                          'কোনো নতুন নোটিফিকেশন নেই',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 6),
                        itemCount: items.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final item = items[index];
                          return Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: item.isRead
                                  ? const Color(0xFFF8FAFC)
                                  : const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: item.isRead
                                    ? const Color(0xFFE2E8F0)
                                    : const Color(0xFFBFDBFE),
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: _getCategoryColor(item.category)
                                        .withValues(alpha: 0.15),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    _getCategoryIcon(item.category),
                                    size: 16,
                                    color: _getCategoryColor(item.category),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.title,
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: item.isRead
                                              ? FontWeight.w700
                                              : FontWeight.w800,
                                          color: AppColors.corporateNavy,
                                        ),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        item.message,
                                        style: const TextStyle(
                                          fontSize: 11.5,
                                          color: AppColors.textSecondary,
                                          height: 1.35,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            _formatTimeAgo(item.timestamp),
                                            style: const TextStyle(
                                              fontSize: 10,
                                              color: AppColors.textMuted,
                                            ),
                                          ),
                                          if (item.category == 'TRACKING' &&
                                              item.relatedCode != null)
                                            InkWell(
                                              onTap: () {
                                                Navigator.pop(context);
                                                onTrackingTap?.call(
                                                    item.relatedCode!);
                                              },
                                              child: const Text(
                                                'ট্র্যাকিং দেখুন ➔',
                                                style: TextStyle(
                                                  fontSize: 10.5,
                                                  fontWeight: FontWeight.w700,
                                                  color: AppColors.success,
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'TRACKING':
        return Icons.track_changes_rounded;
      case 'JOB':
        return Icons.work_rounded;
      default:
        return Icons.campaign_rounded;
    }
  }

  Color _getCategoryColor(String category) {
    switch (category) {
      case 'TRACKING':
        return AppColors.success;
      case 'JOB':
        return AppColors.corporateNavy;
      default:
        return AppColors.corporatePinkHover;
    }
  }

  String _formatTimeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes} মিনিট আগে';
    } else if (diff.inHours < 24) {
      return '${diff.inHours} ঘণ্টা আগে';
    } else {
      return '${diff.inDays} দিন আগে';
    }
  }
}
