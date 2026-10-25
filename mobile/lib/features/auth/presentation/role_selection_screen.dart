import 'package:flutter/material.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_logo.dart';

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
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 10),
              const Center(child: AppLogo(size: 64)),
              const SizedBox(height: 24),
              Text(
                l10n?.translate('welcome_subtitle') ??
                    'Select your portal role to access recruitment services and track your overseas journey.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 30),

              // 1. Candidate Role Card
              _RoleCard(
                title: l10n?.translate('role_candidate') ?? 'Candidate / Migrant Worker',
                subtitle: l10n?.translate('role_candidate_desc') ??
                    'Track applications, view visa status, and upload documents',
                icon: Icons.person_pin_rounded,
                badgeColor: AppColors.corporateNavy,
                onTap: () {
                  _showAuthNotice(context, 'Candidate Portal Login (Phase 2 Integration)');
                },
              ),
              const SizedBox(height: 16),

              // 2. Staff Role Card
              _RoleCard(
                title: l10n?.translate('role_staff') ?? 'Recruitment & Processing Staff',
                subtitle: l10n?.translate('role_staff_desc') ??
                    'Review dossiers, verify documents, and manage stages',
                icon: Icons.badge_rounded,
                badgeColor: AppColors.corporatePinkHover,
                onTap: () {
                  _showAuthNotice(context, 'Staff Workspace Login (Phase 2 Integration)');
                },
              ),
              const SizedBox(height: 16),

              // 3. Admin Role Card
              _RoleCard(
                title: l10n?.translate('role_admin') ?? 'Executive Administrator',
                subtitle: l10n?.translate('role_admin_desc') ??
                    'System oversight, accounts summary, and operational reports',
                icon: Icons.admin_panel_settings_rounded,
                badgeColor: AppColors.deepNavy,
                onTap: () {
                  _showAuthNotice(context, 'Admin ERP Login (Phase 2 Integration)');
                },
              ),
              const SizedBox(height: 30),

              // Helpline Information
              Center(
                child: Text(
                  l10n?.translate('contact_helpline') ?? 'Official Helpline: +880 1913-681771',
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

  void _showAuthNotice(BuildContext context, String title) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppColors.corporateNavy,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Phase 1 foundation and secure API client are ready. Full login screens will be activated in Phase 2.',
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('OK'),
            ),
          ],
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
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: badgeColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: badgeColor, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
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
            Icons.chevron_right_rounded,
            color: AppColors.textMuted,
          ),
        ],
      ),
    );
  }
}
