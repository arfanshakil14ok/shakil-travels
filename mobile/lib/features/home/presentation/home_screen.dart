import 'package:flutter/material.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/config/app_config.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/localization/locale_provider.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_logo.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../auth/presentation/role_selection_screen.dart';

class HomeScreen extends StatefulWidget {
  final bool hasActiveSession;
  final ApiClient? apiClient;

  const HomeScreen({
    super.key,
    this.hasActiveSession = false,
    this.apiClient,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final ApiClient _apiClient;
  bool _isCheckingBackend = false;
  bool? _isBackendHealthy;
  final TextEditingController _trackingController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _apiClient = widget.apiClient ?? ApiClient();
    _checkBackendStatus();
  }

  Future<void> _checkBackendStatus() async {
    setState(() => _isCheckingBackend = true);
    final isHealthy = await _apiClient.checkBackendHealth();
    if (mounted) {
      setState(() {
        _isBackendHealthy = isHealthy;
        _isCheckingBackend = false;
      });
    }
  }

  @override
  void dispose() {
    _trackingController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppColors.surfaceWhite.withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(Icons.flight_takeoff_rounded, size: 20),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: const [
                Text(
                  AppConfig.appName,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.8,
                  ),
                ),
                Text(
                  'Govt. Approved RL-1892',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w400,
                    color: AppColors.corporatePink,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // Language Switcher (Bangla / English)
          IconButton(
            tooltip: 'Switch Language',
            icon: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.corporatePink),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'বাং / EN',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
              ),
            ),
            onPressed: () {
              // Toggling locale through inherited provider or direct localizations
              _showLanguageDialog(context);
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _checkBackendStatus,
        color: AppColors.corporateNavy,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Backend Connectivity & Status Banner
              _buildConnectivityBanner(l10n),
              const SizedBox(height: 16),

              // 2. Hero Recruitment Welcome Card
              AppCard(
                padding: const EdgeInsets.all(20),
                backgroundColor: AppColors.corporateNavy,
                border: Border.all(color: AppColors.corporateNavy),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        StatusBadge(
                          label: 'RECRUITING AGENCY',
                          backgroundColor: AppColors.surfaceWhite.withOpacity(0.15),
                          textColor: AppColors.corporatePink,
                        ),
                        const Icon(
                          Icons.verified_user_rounded,
                          color: AppColors.corporatePink,
                          size: 20,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      l10n?.translate('welcome_title') ?? 'Welcome to SHAKIL TRAVELS',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.surfaceWhite,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      l10n?.translate('app_tagline') ??
                          'Trusted Overseas Recruitment & Government Approved Manpower Agency',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.surfaceWhite.withOpacity(0.85),
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 18),
                    SizedBox(
                      height: 42,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.corporatePink,
                          foregroundColor: AppColors.deepNavy,
                        ),
                        icon: const Icon(Icons.login_rounded, size: 18),
                        label: Text(
                          l10n?.translate('btn_login') ?? 'Access Portal',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const RoleSelectionScreen(),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 3. Quick Application Tracking Card
              AppCard(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.search_rounded, color: AppColors.corporateNavy, size: 22),
                        SizedBox(width: 8),
                        Text(
                          'Quick Application Tracking',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Check the live status of your application or passport deployment.',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: _trackingController,
                      decoration: const InputDecoration(
                        hintText: 'Enter Passport No. (e.g. A01234567)',
                        prefixIcon: Icon(Icons.badge_outlined, size: 20),
                      ),
                    ),
                    const SizedBox(height: 12),
                    AppButton(
                      text: 'Check Status',
                      icon: Icons.track_changes_rounded,
                      onPressed: () {
                        final query = _trackingController.text.trim();
                        if (query.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Please enter a passport number or application ID'),
                            ),
                          );
                        } else {
                          _handleTrackingQuery(query);
                        }
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 4. Role Gateway Grid
              const Text(
                'Portal Services',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _QuickActionCard(
                      icon: Icons.person_rounded,
                      title: 'Candidate',
                      subtitle: 'My Dossier & Visa',
                      color: AppColors.corporateNavy,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const RoleSelectionScreen()),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _QuickActionCard(
                      icon: Icons.work_history_rounded,
                      title: 'Staff Hub',
                      subtitle: 'Field Processing',
                      color: AppColors.corporatePinkHover,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const RoleSelectionScreen()),
                        );
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // 5. Official Helpline & Regulatory Footnote
              AppCard(
                backgroundColor: AppColors.goldLight,
                border: Border.all(color: AppColors.gold.withOpacity(0.3)),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: const [
                    Icon(Icons.phone_in_talk_rounded, color: AppColors.warning, size: 22),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Official Office Helpline',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.warning,
                            ),
                          ),
                          Text(
                            AppConfig.helplineDisplay,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: AppColors.deepNavy,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: Text(
                  '© 2026 SHAKIL TRAVELS • RL-1892 • App v1.0.0',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textMuted,
                  ),
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildConnectivityBanner(AppLocalizations? l10n) {
    if (_isCheckingBackend) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.surfaceWhite,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Row(
          children: const [
            SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: 10),
            Text(
              'Connecting to SHAKIL TRAVELS ERP...',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
        ),
      );
    }

    final isHealthy = _isBackendHealthy ?? false;
    final bg = isHealthy ? AppColors.successLight : AppColors.warningLight;
    final fg = isHealthy ? AppColors.success : AppColors.warning;
    final icon = isHealthy ? Icons.cloud_done_rounded : Icons.cloud_queue_rounded;
    final text = isHealthy
        ? 'Connected to SHAKILWORK ERP'
        : 'Backend server unreachable. Tap to retry.';

    return InkWell(
      onTap: _checkBackendStatus,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: fg),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: fg,
                ),
              ),
            ),
            if (!isHealthy)
              Icon(Icons.refresh_rounded, size: 16, color: fg),
          ],
        ),
      ),
    );
  }

  void _handleTrackingQuery(String query) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(
        child: CircularProgressIndicator(color: AppColors.corporatePink),
      ),
    );

    try {
      final res = await _apiClient.get(
        '/api/track',
        queryParameters: {'passport': query},
      );
      if (mounted) Navigator.pop(context);

      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Application Status'),
            content: Text(res != null ? res.toString() : 'No record found'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Tracking query error: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Select Language / ভাষা নির্বাচন করুন'),
        children: [
          SimpleDialogOption(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('বাংলা (Bengali - Official)'),
          ),
          SimpleDialogOption(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('English (International)'),
          ),
        ],
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
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
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
