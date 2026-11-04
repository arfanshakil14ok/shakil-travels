import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/auth/data/session_model.dart';
import 'package:shakil_travels/features/staff/data/staff_models.dart';
import 'package:shakil_travels/features/staff/data/staff_repository.dart';
import 'staff_interviews_screen.dart';

class StaffDashboardScreen extends StatefulWidget {
  final SessionModel session;
  final StaffRepository? repository;
  final void Function(int)? onNavigateTab;

  const StaffDashboardScreen({
    super.key,
    required this.session,
    this.repository,
    this.onNavigateTab,
  });

  @override
  State<StaffDashboardScreen> createState() => _StaffDashboardScreenState();
}

class _StaffDashboardScreenState extends State<StaffDashboardScreen> {
  late final StaffRepository _repository;
  bool _isLoading = true;
  String? _errorMessage;

  DashboardStatsModel? _stats;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? StaffRepository(apiClient: ApiClient());
    _loadDashboardData();
  }

  Future<void> _loadDashboardData({bool refresh = false}) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final stats = await _repository.getDashboardStats(refresh: refresh);
      if (mounted) {
        setState(() {
          _stats = stats;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: const Text('স্টাফ অপারেশনাল হাব (Staff Workspace)'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed:
                _isLoading ? null : () => _loadDashboardData(refresh: true),
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
        child: LoadingIndicator(message: 'অপারেশনাল মেট্রিক্স লোড হচ্ছে...'),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ErrorView(
            message: _errorMessage!,
            onRetry: () => _loadDashboardData(refresh: true),
          ),
        ),
      );
    }

    final stats = _stats;
    if (stats == null) {
      return const Center(child: Text('কোনো মেট্রিক্স পাওয়া যায়নি।'));
    }

    return RefreshIndicator(
      onRefresh: () => _loadDashboardData(refresh: true),
      color: AppColors.corporateNavy,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildStaffHeaderCard(),
          const SizedBox(height: 14),
          _buildMetricsGrid(stats.business),
          const SizedBox(height: 18),
          _buildSectionHeader(
            'রিক্রুটমেন্ট প্রসেসিং কিউ (Work Queues)',
            Icons.tune_rounded,
          ),
          const SizedBox(height: 10),
          _buildWorkQueuesGrid(),
          const SizedBox(height: 18),
          _buildSectionHeader(
            'সাম্প্রতিক সিস্টেম এক্টিভিটি (Live Audit Feed)',
            Icons.history_rounded,
          ),
          const SizedBox(height: 10),
          _buildRecentActivityList(stats.recentActivity),
          const SizedBox(height: 14),
          _buildOfficialHelplineCard(),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildStaffHeaderCard() {
    final s = widget.session;
    return AppCard(
      backgroundColor: AppColors.corporateNavy,
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: AppColors.corporatePink.withValues(alpha: 0.3),
            child: const Icon(
              Icons.badge_rounded,
              color: AppColors.surfaceWhite,
              size: 32,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Text(
                        s.fullName ?? 'Staff Member',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.surfaceWhite,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    StatusBadge(
                      label: s.role,
                      backgroundColor:
                          AppColors.corporatePink.withValues(alpha: 0.2),
                      textColor: AppColors.corporatePink,
                      icon: Icons.shield_rounded,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  s.email ?? 'staff@shakiltravels.com',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.surfaceWhite.withValues(alpha: 0.85),
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'রিক্রুটিং লাইসেন্স: RL-2579',
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

  Widget _buildMetricsGrid(DashboardBusinessStats b) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _MetricCard(
                title: 'সক্রিয় প্রার্থী',
                count: '${b.activeApplicants}',
                subtitle: 'মোট: ${b.applicants}',
                icon: Icons.people_alt_rounded,
                color: AppColors.corporateNavy,
                onTap: () => widget.onNavigateTab?.call(2), // Applicants
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _MetricCard(
                title: 'চলমান ফাইল',
                count: '${b.applications}',
                subtitle: '১৩-ধাপ পাইপলাইন',
                icon: Icons.folder_open_rounded,
                color: AppColors.corporatePinkHover,
                onTap: () => widget.onNavigateTab?.call(1), // Cases
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _MetricCard(
                title: 'ভিসা প্রসেসিং',
                count: '${b.activeVisas}',
                subtitle: 'দূতাবাস ও সত্যায়ন',
                icon: Icons.verified_user_rounded,
                color: AppColors.warning,
                onTap: () => widget.onNavigateTab?.call(1),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _MetricCard(
                title: 'সফল প্রবাসযাত্রা',
                count: '${b.placements}',
                subtitle: 'যোগদান সম্পন্ন',
                icon: Icons.flight_takeoff_rounded,
                color: AppColors.success,
                onTap: () => widget.onNavigateTab?.call(1),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: AppColors.corporateNavy, size: 20),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            color: AppColors.deepNavy,
          ),
        ),
      ],
    );
  }

  Widget _buildWorkQueuesGrid() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _QueueCard(
                title: 'ডকুমেন্ট ভেরিফিকেশন কিউ',
                subtitle: 'কাগজপত্র নিরীক্ষা ও অনুমোদন',
                icon: Icons.fact_check_rounded,
                color: AppColors.corporateNavy,
                onTap: () =>
                    widget.onNavigateTab?.call(3), // Document review tab
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QueueCard(
                title: 'মেডিকেল ফিটনেস কিউ',
                subtitle: 'গামকা অ্যাপয়েন্টমেন্ট ও রিপোর্ট',
                icon: Icons.medical_services_rounded,
                color: AppColors.warning,
                onTap: () => widget.onNavigateTab?.call(1),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _QueueCard(
                title: 'দূতাবাস ভিসা কিউ',
                subtitle: 'ভিসা সাবমিশন ও স্ট্যাম্পিং',
                icon: Icons.assignment_turned_in_rounded,
                color: AppColors.corporatePinkHover,
                onTap: () => widget.onNavigateTab?.call(1),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QueueCard(
                title: 'ইন্টারভিউ শিডিউল',
                subtitle: 'প্রার্থী বাছাই ও সাক্ষাৎকার',
                icon: Icons.event_available_rounded,
                color: AppColors.success,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) =>
                          StaffInterviewsScreen(repository: _repository),
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

  Widget _buildRecentActivityList(List<StaffAuditLogModel> activity) {
    if (activity.isEmpty) {
      return const AppCard(
        padding: EdgeInsets.all(16),
        child: Center(
          child: Text(
            'কোনো সাম্প্রতিক অডিট এক্টিভিটি নেই।',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
        ),
      );
    }

    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      child: Column(
        children: List.generate(activity.length.clamp(0, 4), (index) {
          final act = activity[index];
          final isLast = index == activity.length.clamp(0, 4) - 1;

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
                        color: AppColors.pageBackground,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.cardBorder),
                      ),
                      child: const Icon(
                        Icons.bolt_rounded,
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
                              'কর্মকর্তা: ${act.userName}',
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

  Widget _buildOfficialHelplineCard() {
    return AppCard(
      backgroundColor: AppColors.goldLight,
      border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: const Row(
        children: [
          Icon(Icons.security_rounded, color: AppColors.warning, size: 24),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'শাকিল ট্রাভেলস ইআরপি ব্যাকএন্ড সরাসরি সরকারি বিএমইটি ও সিকিউর আরব্যাক দ্বারা সুরক্ষিত।',
              style: TextStyle(
                fontSize: 11,
                color: AppColors.textPrimary,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String count;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _MetricCard({
    required this.title,
    required this.count,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
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
            count,
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

class _QueueCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _QueueCard({
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
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AppColors.deepNavy,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 10,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
