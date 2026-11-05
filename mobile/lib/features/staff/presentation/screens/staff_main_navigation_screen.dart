import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_app_bar.dart';
import '../../../../shared/widgets/app_bottom_navigation.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/auth/data/auth_repository.dart';
import 'package:shakil_travels/features/auth/data/session_model.dart';
import 'package:shakil_travels/features/auth/presentation/unified_login_screen.dart';
import 'package:shakil_travels/features/staff/data/staff_repository.dart';
import 'staff_applicants_screen.dart';
import 'staff_dashboard_screen.dart';
import 'staff_document_review_screen.dart';
import 'staff_processing_cases_screen.dart';

class StaffMainNavigationScreen extends StatefulWidget {
  final SessionModel session;
  final int initialTabIndex;
  final StaffRepository? repository;
  final AuthRepository? authRepository;

  const StaffMainNavigationScreen({
    super.key,
    required this.session,
    this.initialTabIndex = 0,
    this.repository,
    this.authRepository,
  });

  @override
  State<StaffMainNavigationScreen> createState() =>
      _StaffMainNavigationScreenState();
}

class _StaffMainNavigationScreenState extends State<StaffMainNavigationScreen> {
  late int _currentIndex;
  late final StaffRepository _repository;
  late final AuthRepository _authRepository;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialTabIndex;
    _repository = widget.repository ?? StaffRepository(apiClient: ApiClient());
    _authRepository =
        widget.authRepository ?? AuthRepository(apiClient: ApiClient());
  }

  void _onTabSelected(int index) {
    if (_currentIndex != index) {
      setState(() => _currentIndex = index);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          StaffDashboardScreen(
            session: widget.session,
            repository: _repository,
            onNavigateTab: _onTabSelected,
          ),
          StaffProcessingCasesScreen(repository: _repository),
          StaffApplicantsScreen(repository: _repository),
          StaffDocumentReviewScreen(repository: _repository),
          _StaffProfileTab(
            session: widget.session,
            authRepository: _authRepository,
          ),
        ],
      ),
      bottomNavigationBar: AppBottomNavigation(
        currentIndex: _currentIndex,
        onTap: _onTabSelected,
        items: const [
          AppBottomNavItem(
            icon: Icons.dashboard_rounded,
            label: 'ওভারভিউ',
            tooltip: 'স্টাফ ড্যাশবোর্ড',
          ),
          AppBottomNavItem(
            icon: Icons.folder_shared_rounded,
            label: 'প্রসেসিং',
            tooltip: '১৩-ধাপ কেস প্রসেসিং',
          ),
          AppBottomNavItem(
            icon: Icons.people_alt_rounded,
            label: 'প্রার্থীগণ',
            tooltip: 'আবেদনকারী তালিকা',
          ),
          AppBottomNavItem(
            icon: Icons.fact_check_rounded,
            label: 'ডকুমেন্টস',
            tooltip: 'ডকুমেন্ট রিভিউ কিউ',
          ),
          AppBottomNavItem(
            icon: Icons.account_circle_rounded,
            label: 'প্রোফাইল',
            tooltip: 'স্টাফ প্রোফাইল ও নিরাপত্তা',
          ),
        ],
      ),
    );
  }
}

class _StaffProfileTab extends StatelessWidget {
  final SessionModel session;
  final AuthRepository authRepository;

  const _StaffProfileTab({required this.session, required this.authRepository});

  Future<void> _handleLogout(BuildContext context) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('স্টাফ সেশন লগআউট'),
        content: const Text(
          'আপনি কি নিশ্চিত যে আপনার স্টাফ একাউন্ট থেকে সাইন আউট করতে চান?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('বাতিল'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('লগআউট', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await authRepository.logout();
      if (context.mounted) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const UnifiedLoginScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: const AppAppBar(
        title: 'স্টাফ প্রোফাইল ও নিরাপত্তা',
        subtitle: 'শাকিল ট্রাভেলস • RL-2579',
        showBackButton: false,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          AppCard(
            backgroundColor: AppColors.corporateNavy,
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor:
                      AppColors.corporatePink.withValues(alpha: 0.3),
                  child: const Icon(
                    Icons.person_rounded,
                    color: Colors.white,
                    size: 36,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        session.fullName ?? 'Staff Member',
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        session.email ?? 'staff@shakiltravels.com',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withValues(alpha: 0.85),
                        ),
                      ),
                      const SizedBox(height: 6),
                      StatusBadge(
                        label: session.role,
                        backgroundColor: AppColors.corporatePink.withValues(
                          alpha: 0.2,
                        ),
                        textColor: AppColors.corporatePink,
                        icon: Icons.shield_rounded,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          AppCard(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'স্টাফ একাউন্ট বিবরণ',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: AppColors.deepNavy,
                  ),
                ),
                const SizedBox(height: 12),
                _buildInfoRow('অফিস আইডি (User ID)', session.userId),
                _buildInfoRow('ইমেইল ঠিকানা', session.email ?? 'N/A'),
                _buildInfoRow('নির্ধারিত ভূমিকা', session.role),
                _buildInfoRow(
                  'অনুমোদিত পারমিশন সংখ্যা',
                  '${session.permissions.length} টি পারমিশন কোড',
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          const AppCard(
            padding: EdgeInsets.all(14),
            child: Row(
              children: [
                Icon(
                  Icons.security_rounded,
                  color: AppColors.corporateNavy,
                  size: 24,
                ),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'অফিসিয়াল রিক্রুটিং লাইসেন্স: RL-2579\nশাকিল ট্রাভেলস হেড অফিস ইআরপি নেটওয়ার্ক',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.deepNavy,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          Center(
            child: TextButton.icon(
              style: TextButton.styleFrom(
                foregroundColor: AppColors.error,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.xl,
                  vertical: AppSpacing.md,
                ),
              ),
              icon: const Icon(Icons.logout_rounded, size: 20),
              label: const Text(
                'স্টাফ একাউন্ট থেকে সাইন আউট করুন',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
              ),
              onPressed: () => _handleLogout(context),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
          Flexible(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
