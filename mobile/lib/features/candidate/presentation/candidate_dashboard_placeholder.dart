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

class CandidateDashboardPlaceholder extends StatelessWidget {
  final SessionModel session;
  final AuthRepository? authRepository;

  const CandidateDashboardPlaceholder({
    super.key,
    required this.session,
    this.authRepository,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: const Text('Candidate Portal'),
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
                backgroundColor: AppColors.corporateNavy,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        StatusBadge.verified('ACTIVE CANDIDATE'),
                        const Icon(
                          Icons.badge_rounded,
                          color: AppColors.corporatePink,
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      session.fullName ?? 'Candidate Member',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: AppColors.surfaceWhite,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Applicant ID: ${session.applicantNumber ?? session.userId}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.corporatePink,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (session.phone != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        'Phone: ${session.phone}',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.surfaceWhite.withValues(alpha: 0.8),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const AppCard(
                child: Column(
                  children: [
                    Icon(
                      Icons.hourglass_top_rounded,
                      size: 48,
                      color: AppColors.corporatePink,
                    ),
                    SizedBox(height: 12),
                    Text(
                      'Candidate Portal Dashboard',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Authentication successful! Full job browsing, passport document uploads, and 13-stage visa tracker will activate in Phase 3.',
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
