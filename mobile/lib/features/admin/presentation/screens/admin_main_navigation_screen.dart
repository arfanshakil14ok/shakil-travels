import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/auth/data/auth_repository.dart';
import 'package:shakil_travels/features/auth/data/session_model.dart';
import 'package:shakil_travels/features/auth/presentation/role_selection_screen.dart';
import 'package:shakil_travels/features/staff/data/staff_repository.dart';
import 'package:shakil_travels/features/staff/presentation/screens/staff_processing_cases_screen.dart';
import 'admin_audit_logs_screen.dart';
import 'admin_dashboard_screen.dart';
import 'admin_job_demands_screen.dart';

class AdminMainNavigationScreen extends StatefulWidget {
  final SessionModel session;
  final int initialTabIndex;
  final StaffRepository? repository;
  final AuthRepository? authRepository;

  const AdminMainNavigationScreen({
    super.key,
    required this.session,
    this.initialTabIndex = 0,
    this.repository,
    this.authRepository,
  });

  @override
  State<AdminMainNavigationScreen> createState() =>
      _AdminMainNavigationScreenState();
}

class _AdminMainNavigationScreenState extends State<AdminMainNavigationScreen> {
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
          AdminDashboardScreen(
            session: widget.session,
            repository: _repository,
            onNavigateTab: _onTabSelected,
          ),
          StaffProcessingCasesScreen(repository: _repository),
          AdminJobDemandsScreen(repository: _repository),
          AdminAuditLogsScreen(repository: _repository),
          _AdminProfileTab(
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
              icon: Icon(Icons.analytics_rounded),
              activeIcon: Icon(
                Icons.analytics_rounded,
                color: AppColors.corporateNavy,
              ),
              label: 'ওভারসাইট',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.folder_shared_rounded),
              activeIcon: Icon(
                Icons.folder_shared_rounded,
                color: AppColors.corporateNavy,
              ),
              label: 'ফাইলসমূহ',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.work_rounded),
              activeIcon: Icon(
                Icons.work_rounded,
                color: AppColors.corporateNavy,
              ),
              label: 'সার্কুলার',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.history_rounded),
              activeIcon: Icon(
                Icons.history_rounded,
                color: AppColors.corporateNavy,
              ),
              label: 'অডিট লগ',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.admin_panel_settings_rounded),
              activeIcon: Icon(
                Icons.admin_panel_settings_rounded,
                color: AppColors.corporateNavy,
              ),
              label: 'এডমিন',
            ),
          ],
        ),
      ),
    );
  }
}

class _AdminProfileTab extends StatelessWidget {
  final SessionModel session;
  final AuthRepository authRepository;

  const _AdminProfileTab({required this.session, required this.authRepository});

  Future<void> _handleLogout(BuildContext context) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('এডমিন সেশন লগআউট'),
        content: const Text(
          'আপনি কি নিশ্চিত যে আপনার প্রশাসনিক একাউন্ট থেকে সাইন আউট করতে চান?',
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
        title: const Text('এডমিন প্রোফাইল ও সেশন'),
        centerTitle: false,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppCard(
            backgroundColor: AppColors.deepNavy,
            padding: const EdgeInsets.all(18),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor:
                      AppColors.corporatePink.withValues(alpha: 0.3),
                  child: const Icon(
                    Icons.security_rounded,
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
                        session.fullName ?? 'System Administrator',
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        session.email ?? 'admin@shakiltravels.com',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withValues(alpha: 0.85),
                        ),
                      ),
                      const SizedBox(height: 6),
                      StatusBadge(
                        label:
                            session.isSuperAdmin ? 'SUPER ADMIN' : session.role,
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
                  'প্রশাসনিক বিশেষাধিকার (Administrative Privileges)',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: AppColors.deepNavy,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  session.isSuperAdmin
                      ? 'সম্পূর্ণ সিস্টেম ও হেডকোয়ার্টার্স ডাটাবেজ এক্সেস সক্রিয় (SUPER_ADMIN Privileges Active)।'
                      : 'এডমিনিস্ট্রেটিভ রোল ও নির্ধারিত পারমিশন সক্রিয়।',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    height: 1.4,
                  ),
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
                    'অফিসিয়াল রিক্রুটিং লাইসেন্স: RL-2579\nশাকিল ট্রাভেলস ইআরপি সিকিউর এডমিন চ্যানেল',
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
                'এডমিন একাউন্ট থেকে সাইন আউট করুন',
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
