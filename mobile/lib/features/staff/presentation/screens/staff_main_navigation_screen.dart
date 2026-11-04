import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/auth/data/auth_repository.dart';
import 'package:shakil_travels/features/auth/data/session_model.dart';
import 'package:shakil_travels/features/auth/presentation/role_selection_screen.dart';
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
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.surfaceWhite,
          boxShadow: [
            BoxShadow(
              color: Color(0x0F000000),
              offset: Offset(0, -2),
              blurRadius: 8,
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: _onTabSelected,
          type: BottomNavigationBarType.fixed,
          backgroundColor: AppColors.surfaceWhite,
          selectedItemColor: AppColors.corporateNavy,
          unselectedItemColor: AppColors.textDisabled,
          selectedFontSize: 11,
          unselectedFontSize: 11,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w700),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500),
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_rounded),
              activeIcon: Icon(
                Icons.dashboard_rounded,
                color: AppColors.corporateNavy,
              ),
              label: 'ওভারভিউ',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.folder_shared_rounded),
              activeIcon: Icon(
                Icons.folder_shared_rounded,
                color: AppColors.corporateNavy,
              ),
              label: 'প্রসেসিং',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.people_alt_rounded),
              activeIcon: Icon(
                Icons.people_alt_rounded,
                color: AppColors.corporateNavy,
              ),
              label: 'প্রার্থীগণ',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.fact_check_rounded),
              activeIcon: Icon(
                Icons.fact_check_rounded,
                color: AppColors.corporateNavy,
              ),
              label: 'ডকুমেন্টস',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.account_circle_rounded),
              activeIcon: Icon(
                Icons.account_circle_rounded,
                color: AppColors.corporateNavy,
              ),
              label: 'প্রোফাইল',
            ),
          ],
        ),
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
          MaterialPageRoute(builder: (_) => const RoleSelectionScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: const Text('স্টাফ প্রোফাইল ও নিরাপত্তা'),
        centerTitle: false,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppCard(
            backgroundColor: AppColors.corporateNavy,
            padding: const EdgeInsets.all(18),
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
                const SizedBox(width: 14),
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
          const SizedBox(height: 14),
          AppCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'নিযুক্ত পারমিশন সমূহ (Active Role Permissions)',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: AppColors.deepNavy,
                  ),
                ),
                const SizedBox(height: 10),
                if (session.permissions.isEmpty)
                  Text(
                    session.isSuperAdmin
                        ? 'SUPER_ADMIN: সকল মডিউলে পূর্ণ প্রবেশাধিকার'
                        : 'কোনো বিশেষ পারমিশন অ্যাসাইন করা নেই।',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  )
                else
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: session.permissions.map((p) {
                      return Chip(
                        label: Text(
                          p,
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        backgroundColor: AppColors.pageBackground,
                        side: const BorderSide(color: AppColors.cardBorder),
                        padding: EdgeInsets.zero,
                      );
                    }).toList(),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          const AppCard(
            padding: EdgeInsets.all(14),
            child: Row(
              children: [
                Icon(
                  Icons.verified_rounded,
                  color: AppColors.success,
                  size: 24,
                ),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'অফিসিয়াল রিক্রুটিং লাইসেন্স: RL-2579\nশাকিল ট্রাভেলস ইআরপি সিকিউর সেশন',
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
          const SizedBox(height: 24),
          Center(
            child: TextButton.icon(
              style: TextButton.styleFrom(
                foregroundColor: AppColors.error,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
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
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
