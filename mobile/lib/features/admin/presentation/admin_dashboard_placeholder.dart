import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/security/secure_storage.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/auth/data/auth_repository.dart';
import 'package:shakil_travels/features/auth/data/session_model.dart';

class AdminDashboardPlaceholder extends StatelessWidget {
  final SessionModel session;
  final AuthRepository? authRepository;

  const AdminDashboardPlaceholder({
    super.key,
    required this.session,
    this.authRepository,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: const Text('Admin Management ERP'),
        backgroundColor: AppColors.deepNavy,
        actions: [
          IconButton(
            tooltip: 'Logout',
            icon: const Icon(Icons.logout_rounded),
            onPressed: () => _handleLogout(context),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AppCard(
                backgroundColor: AppColors.deepNavy,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        StatusBadge(
                          label: session.isSuperAdmin
                              ? 'SUPER ADMIN'
                              : 'ADMINISTRATOR',
                          backgroundColor: AppColors.corporatePink,
                          textColor: AppColors.deepNavy,
                          icon: Icons.admin_panel_settings_rounded,
                        ),
                        const Icon(
                          Icons.security_rounded,
                          color: AppColors.corporatePink,
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      session.fullName ?? 'Administrator',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: AppColors.surfaceWhite,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      session.email ?? '',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.corporatePink,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Root ERP Access Privileges Verified',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.surfaceWhite.withValues(alpha: 0.7),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const AppCard(
                child: Column(
                  children: [
                    Icon(
                      Icons.dashboard_customize_rounded,
                      size: 48,
                      color: AppColors.corporateNavy,
                    ),
                    SizedBox(height: 12),
                    Text(
                      'Executive Admin Console',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Administrative privileges verified. High-level financial KPIs, staff management, and system trash audit will be accessible in Phase 5.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              AppButton(
                text: 'Sign Out / লগআউট',
                variant: AppButtonVariant.outline,
                icon: Icons.logout_rounded,
                onPressed: () => _handleLogout(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleLogout(BuildContext context) async {
    final repo = authRepository ??
        AuthRepository(
          apiClient: ApiClient(),
          secureStorage: SecureStorageService(),
        );
    await repo.logout();
    if (context.mounted) {
      Navigator.of(context)
          .pushNamedAndRemoveUntil(AppRouter.home, (route) => false);
    }
  }
}
