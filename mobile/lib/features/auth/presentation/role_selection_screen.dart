import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_logo.dart';
import 'candidate_login_screen.dart';
import 'staff_login_screen.dart';
import 'admin_login_screen.dart';
import 'server_config_dialog.dart';

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: Text(l10n?.translate('welcome_title') ?? 'SHAKIL TRAVELS'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_ethernet_rounded),
            tooltip: 'Server Settings',
            onPressed: () => ServerConfigDialog.show(context),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 10),
              const Center(child: AppLogo(size: 64)),
              const SizedBox(height: 20),
              Text(
                l10n?.translate('welcome_subtitle') ??
                    'Select your portal role to access recruitment services and track your overseas journey.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 28),

              // 1. Candidate Role Card
              _RoleCard(
                title: l10n?.translate('role_candidate') ??
                    'Candidate / Migrant Worker',
                subtitle: l10n?.translate('role_candidate_desc') ??
                    'Track applications, view visa status, and upload documents',
                icon: Icons.person_pin_rounded,
                badgeColor: AppColors.corporateNavy,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const CandidateLoginScreen(),
                    ),
                  );
                },
              ),
              const SizedBox(height: 14),

              // 2. Staff Role Card
              _RoleCard(
                title: l10n?.translate('role_staff') ??
                    'Recruitment & Processing Staff',
                subtitle: l10n?.translate('role_staff_desc') ??
                    'Review dossiers, verify documents, and manage stages',
                icon: Icons.badge_rounded,
                badgeColor: AppColors.corporatePinkHover,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const StaffLoginScreen()),
                  );
                },
              ),
              const SizedBox(height: 14),

              // 3. Admin Role Card
              _RoleCard(
                title:
                    l10n?.translate('role_admin') ?? 'Executive Administrator',
                subtitle: l10n?.translate('role_admin_desc') ??
                    'System oversight, accounts summary, and operational reports',
                icon: Icons.admin_panel_settings_rounded,
                badgeColor: AppColors.deepNavy,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const AdminLoginScreen()),
                  );
                },
              ),
              const SizedBox(height: 28),

              // Security notice
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: AppColors.surfaceWhite,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: const Row(
                  children: [
                    Icon(
                      Icons.lock_clock_rounded,
                      size: 20,
                      color: AppColors.corporateNavy,
                    ),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Role-based access is validated cryptographically on the server for every operation.',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Helpline Information
              Center(
                child: Text(
                  l10n?.translate('contact_helpline') ??
                      'Official Helpline: +880 1913-681771',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color badgeColor;
  final VoidCallback onTap;

  const _RoleCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.badgeColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: badgeColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: badgeColor, size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.arrow_forward_ios_rounded,
            size: 14,
            color: AppColors.textMuted,
          ),
        ],
      ),
    );
  }
}
