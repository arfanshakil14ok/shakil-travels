import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/notifications/notifications_sheet.dart';
import '../../../../shared/widgets/app_app_bar.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/auth/data/session_model.dart';
import 'package:shakil_travels/features/staff/data/staff_models.dart';
import 'package:shakil_travels/features/staff/data/staff_repository.dart';
import 'package:shakil_travels/features/staff/presentation/screens/qr_verification_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  final SessionModel session;
  final StaffRepository? repository;
  final void Function(int)? onNavigateTab;

  const AdminDashboardScreen({
    super.key,
    required this.session,
    this.repository,
    this.onNavigateTab,
  });

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  late final StaffRepository _repository;
  bool _isLoading = true;
  String? _errorMessage;

  DashboardStatsModel? _stats;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? StaffRepository(apiClient: ApiClient());
    _loadStats();
  }

  Future<void> _loadStats({bool refresh = false}) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await _repository.getDashboardStats(refresh: refresh);
      if (mounted) {
        setState(() {
          _stats = data;
          _isLoading = false;
        });
      }
    } on NetworkException catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'ইন্টারনেট সংযোগ পাওয়া যায়নি। পুনরায় চেষ্টা করুন।';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString().replaceFirst('ApiException: ', '');
        });
      }
    }
  }

  bool get _canViewFinance {
    return widget.session.isSuperAdmin ||
        widget.session.hasPermission('INVOICE_VIEW') ||
        widget.session.hasPermission('PAYMENT_VIEW');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppAppBar(
        title: 'এডমিন এক্সিকিউটিভ ড্যাশবোর্ড',
        subtitle: '${widget.session.role} • RL-2579',
        showBackButton: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded),
            color: AppColors.surfaceWhite,
            tooltip: 'বিজ্ঞপ্তি (Notifications)',
            onPressed: () => NotificationsSheet.show(context),
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            color: AppColors.surfaceWhite,
            onPressed: _isLoading ? null : () => _loadStats(refresh: true),
            tooltip: 'রিফ্রেশ করুন',
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: LoadingIndicator(
          message: 'এক্সিকিউটিভ ওভারসাইট তথ্য লোড হচ্ছে...',
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xxl),
          child: ErrorView(
            message: _errorMessage!,
            onRetry: () => _loadStats(refresh: true),
          ),
        ),
      );
    }

    final stats = _stats;
    if (stats == null) {
      return const Center(child: Text('কোনো মেট্রিক্স পাওয়া যায়নি।'));
    }

    return RefreshIndicator(
      onRefresh: () => _loadStats(refresh: true),
      color: AppColors.corporateNavy,
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          _buildAdminHeaderCard(),
          const SizedBox(height: AppSpacing.md),
          _buildQuickActionShortcuts(),
          const SizedBox(height: AppSpacing.lg),
          _buildStaffWorkforceCard(stats.staff),
          const SizedBox(height: AppSpacing.md),
          _buildBusinessMetricsGrid(stats.business),
          if (_canViewFinance) ...[
            const SizedBox(height: AppSpacing.md),
            _buildFinancialOverviewCard(stats.business),
          ],
          const SizedBox(height: AppSpacing.lg),
          _buildSecurityPolicyCard(),
          const SizedBox(height: AppSpacing.lg),
          _buildAuditStreamHeader(),
          const SizedBox(height: AppSpacing.sm),
          _buildAuditStreamList(stats.recentActivity),
          const SizedBox(height: AppSpacing.xxl),
        ],
      ),
    );
  }

  Widget _buildAdminHeaderCard() {
    final s = widget.session;
    return AppCard(
      backgroundColor: AppColors.deepNavy,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: AppColors.corporatePink.withValues(alpha: 0.3),
            child: const Icon(
              Icons.admin_panel_settings_rounded,
              color: Colors.white,
              size: 32,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Text(
                        s.fullName ?? 'Executive Administrator',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    StatusBadge(
                      label:
                          s.isSuperAdmin ? 'SUPER ADMIN' : s.role,
                      backgroundColor:
                          AppColors.corporatePink.withValues(alpha: 0.2),
                      textColor: AppColors.corporatePink,
                      icon: Icons.shield_rounded,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  s.email ?? 'admin@shakiltravels.com',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'রিক্রুটিং লাইসেন্স: RL-2579 • হেডকোয়ার্টার্স ইআরপি',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.corporatePink,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionShortcuts() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'প্রশাসনিক একশন হাব (Admin Command Center)',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppColors.deepNavy,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Row(
          children: [
            Expanded(
              child: _AdminShortcutCard(
                title: 'চাকরির সার্কুলার',
                subtitle: 'ডিমান্ড ও নিয়োগপত্র',
                icon: Icons.work_rounded,
                color: AppColors.corporateNavy,
                onTap: () => widget.onNavigateTab?.call(1),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: _AdminShortcutCard(
                title: 'কেস প্রসেসিং',
                subtitle: '১৩-ধাপ পাইপলাইন',
                icon: Icons.folder_shared_rounded,
                color: AppColors.corporatePinkHover,
                onTap: () => widget.onNavigateTab?.call(2),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: _AdminShortcutCard(
                title: 'কিউআর ভেরিফাই',
                subtitle: 'প্রার্থী স্ক্যানার',
                icon: Icons.qr_code_scanner_rounded,
                color: AppColors.success,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const QrVerificationScreen(),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStaffWorkforceCard(DashboardStaffStats staff) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(child: Text('স্টাফ ও কর্মকর্তা ওভারভিউ (Staff Workforce)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.deepNavy), overflow: TextOverflow.ellipsis)), const SizedBox(width: AppSpacing.sm),
              Text(
                'মোট: ${staff.total} জন',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.corporateNavy,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildSubStat(
                  'সক্রিয় কর্মকর্তা',
                  '${staff.active} জন',
                  AppColors.success,
                ),
              ),
              Expanded(
                child: _buildSubStat(
                  'নিষ্ক্রিয় / স্থগিত',
                  '${staff.inactive} জন',
                  AppColors.warning,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBusinessMetricsGrid(DashboardBusinessStats b) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _MetricCard(
                title: 'প্রার্থী ডাটাবেজ',
                value: '${b.applicants}',
                subtitle: 'সক্রিয়: ${b.activeApplicants}',
                icon: Icons.people_alt_rounded,
                color: AppColors.corporateNavy,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: _MetricCard(
                title: 'চাকরির সার্কুলার',
                value: '${b.jobs}',
                subtitle: 'প্রকাশিত: ${b.publishedJobs}',
                icon: Icons.work_rounded,
                color: AppColors.corporatePinkHover,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            Expanded(
              child: _MetricCard(
                title: 'ভিসা কেস ফাইল',
                value: '${b.activeVisas}',
                subtitle: 'স্ট্যাম্পিং ও সত্যায়ন',
                icon: Icons.verified_user_rounded,
                color: AppColors.warning,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: _MetricCard(
                title: 'সফল প্রবাস গমন',
                value: '${b.placements}',
                subtitle: 'যোগদান সম্পন্ন',
                icon: Icons.flight_takeoff_rounded,
                color: AppColors.success,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFinancialOverviewCard(DashboardBusinessStats b) {
    return AppCard(
      backgroundColor: AppColors.corporateNavy,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'আর্থিক হিসাব নিরীক্ষা (Authorized Financial Oversight)',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.corporatePink,
                ),
              ),
              Icon(
                Icons.lock_clock_rounded,
                color: AppColors.corporatePink,
                size: 16,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(children: [Expanded(child: _buildFinanceColumn('মোট গৃহীত জমা (Payments)', b.payments, AppColors.success)), const SizedBox(width: AppSpacing.md), Expanded(child: _buildFinanceColumn('মোট বকেয়া পাওনা (Dues)', b.dues, AppColors.surfaceWhite))]),
        ],
      ),
    );
  }

  Widget _buildFinanceColumn(String title, double amount, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 11,
            color: AppColors.surfaceWhite.withValues(alpha: 0.8),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          '৳ ${_formatCurrency(amount)}',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildSecurityPolicyCard() {
    return AppCard(
      backgroundColor: AppColors.goldLight,
      border: Border.all(color: AppColors.gold.withValues(alpha: 0.5)),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.security_update_good_rounded,
            color: AppColors.warning,
            size: 22,
          ),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'নিরাপত্তা নির্দেশিকা: সর্বোচ্চ সুরক্ষার স্বার্থে ডাটাবেজ রিসেট, বাল্ক ডিলিশন বা পাসওয়ার্ড রিভিল মোবাইল অ্যাপে নিষিদ্ধ। এসব কাজ শুধুমাত্র সিকিউর ওয়েব টার্মিনাল থেকে অনুমোদিত।',
              style: TextStyle(
                fontSize: 11,
                color: AppColors.deepNavy,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAuditStreamHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Row(
          children: [
            Icon(
              Icons.history_edu_rounded,
              color: AppColors.corporateNavy,
              size: 20,
            ),
            SizedBox(width: 8),
            Text(
              'সিস্টেম অডিট ট্রেইল (Recent Activity)',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: AppColors.deepNavy,
              ),
            ),
          ],
        ),
        TextButton(
          onPressed: () =>
              widget.onNavigateTab?.call(3), // Jump to Audit Logs tab
          child: const Text('সব দেখুন', style: TextStyle(fontSize: 12)),
        ),
      ],
    );
  }

  Widget _buildAuditStreamList(List<StaffAuditLogModel> activity) {
    if (activity.isEmpty) {
      return const AppCard(
        padding: EdgeInsets.all(AppSpacing.lg),
        child: Center(
          child: Text(
            'কোনো অডিট রেকর্ড নেই।',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
        ),
      );
    }

    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
      child: Column(
        children: List.generate(activity.length.clamp(0, 5), (index) {
          final act = activity[index];
          final isLast = index == activity.length.clamp(0, 5) - 1;

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppColors.corporateNavy.withValues(alpha: 0.08),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.shield_outlined,
                        size: 16,
                        color: AppColors.corporateNavy,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                act.action,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.deepNavy,
                                ),
                              ),
                              Text(
                                act.createdAt.split('T').first,
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: AppColors.textDisabled,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            act.description ?? act.entity,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          if (act.userName != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              'ইউজার: ${act.userName}',
                              style: const TextStyle(
                                fontSize: 10,
                                color: AppColors.corporatePinkHover,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              if (!isLast)
                const Divider(height: 1, color: AppColors.cardBorder),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildSubStat(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
      ],
    );
  }

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;

  const _MetricCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textSecondary,
                ),
              ),
              Icon(icon, color: color, size: 20),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: const TextStyle(fontSize: 10, color: AppColors.textDisabled),
          ),
        ],
      ),
    );
  }
}

class _AdminShortcutCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _AdminShortcutCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.sm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 6),
          Text(
            title,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.deepNavy,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 9,
              color: AppColors.textSecondary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
