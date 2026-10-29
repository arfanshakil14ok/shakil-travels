import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/config/app_config.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/network/api_client.dart';
import '../../../core/notifications/notification_service.dart';
import '../../../core/notifications/notifications_sheet.dart';
import '../../../core/utils/support_launcher.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../auth/presentation/role_selection_screen.dart';
import '../../auth/presentation/server_config_dialog.dart';
import '../../candidate/presentation/screens/candidate_jobs_screen.dart';
import 'widgets/home_destinations_section.dart';
import 'widgets/home_featured_jobs.dart';
import 'widgets/home_hero_card.dart';
import 'widgets/home_process_roadmap.dart';
import 'widgets/home_tracking_view.dart';
import 'widgets/home_trust_and_faq.dart';

class HomeScreen extends StatefulWidget {
  final bool hasActiveSession;
  final ApiClient? apiClient;

  const HomeScreen({super.key, this.hasActiveSession = false, this.apiClient});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final ApiClient _apiClient;
  final NotificationService _notificationService = NotificationService();
  bool _isCheckingBackend = false;
  bool? _isBackendHealthy;
  final TextEditingController _trackingController = TextEditingController();

  int _selectedTabIndex = 0;
  String? _jobsSearchQuery;
  String? _jobsSelectedCountryCode;

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

  void _navigateToJobsWithFilter({String? search, String? countryCode}) {
    setState(() {
      _selectedTabIndex = 1;
      _jobsSearchQuery = search;
      _jobsSelectedCountryCode = countryCode;
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: AppColors.corporateNavy,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.flight_takeoff_rounded,
                size: 16,
                color: Colors.white,
              ),
            ),
            const SizedBox(width: 6),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    AppConfig.appName,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      color: AppColors.corporateNavy,
                      letterSpacing: 0.2,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    'Govt. Approved RL-2579',
                    style: TextStyle(
                      fontSize: 8.5,
                      fontWeight: FontWeight.w700,
                      color: AppColors.corporatePinkHover,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          // 0. Notification Bell with Badge
          AnimatedBuilder(
            animation: _notificationService,
            builder: (context, _) {
              final unread = _notificationService.unreadCount;
              return IconButton(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                constraints: const BoxConstraints(),
                tooltip: 'Notifications / নোটিফিকেশন',
                icon: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const Icon(
                      Icons.notifications_none_rounded,
                      color: AppColors.corporateNavy,
                      size: 20,
                    ),
                    if (unread > 0)
                      Positioned(
                        top: -3,
                        right: -3,
                        child: Container(
                          padding: const EdgeInsets.all(2.5),
                          decoration: const BoxDecoration(
                            color: AppColors.corporatePink,
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(
                              minWidth: 14, minHeight: 14),
                          child: Text(
                            '$unread',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 8.5,
                              fontWeight: FontWeight.w800,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  ],
                ),
                onPressed: () {
                  NotificationsSheet.show(
                    context,
                    service: _notificationService,
                    onTrackingTap: (code) {
                      _trackingController.text = code;
                      setState(() => _selectedTabIndex = 2);
                    },
                  );
                },
              );
            },
          ),

          // 1. Language Switcher Button
          IconButton(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            constraints: const BoxConstraints(),
            tooltip: 'Switch Language / ভাষা নির্বাচন',
            icon: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFFC8DCF0)),
                borderRadius: BorderRadius.circular(6),
                color: const Color(0xFFF0F6FC),
              ),
              child: const Text(
                'বাং / EN',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: AppColors.corporateNavy,
                ),
              ),
            ),
            onPressed: () => _showLanguageDialog(context),
          ),

          // 2. Server Settings Dialog
          IconButton(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            constraints: const BoxConstraints(),
            icon: const Icon(
              Icons.settings_ethernet_rounded,
              color: AppColors.corporateNavy,
              size: 19,
            ),
            tooltip: 'Server Settings',
            onPressed: () => ServerConfigDialog.show(context),
          ),

          // 3. Direct Helpline Hotline Dialog
          IconButton(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            constraints: const BoxConstraints(),
            icon: const Icon(
              Icons.phone_in_talk_rounded,
              color: AppColors.success,
              size: 19,
            ),
            tooltip: 'Helpline: +8801913681771',
            onPressed: () => _showHelplineDialog(context),
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: IndexedStack(
        index: _selectedTabIndex,
        children: [
          // Tab 0: Home Public Portal (Matches website mobile layout)
          _buildHomeTab(l10n),

          // Tab 1: All Job Circulars
          CandidateJobsScreen(
            key: ValueKey('jobs_${_jobsSearchQuery}_$_jobsSelectedCountryCode'),
            initialSearch: _jobsSearchQuery,
            initialCountryId: _jobsSelectedCountryCode,
          ),

          // Tab 2: Dedicated File & Visa Tracking
          HomeTrackingView(
            key: ValueKey('track_${_trackingController.text}'),
            initialQuery: _trackingController.text,
            notificationService: _notificationService,
          ),

          // Tab 3: Unified Role Portal Access
          const RoleSelectionScreen(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(
            top: BorderSide(color: Color(0xFFE2E8F0), width: 1),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedTabIndex,
          onTap: (index) {
            setState(() {
              _selectedTabIndex = index;
            });
          },
          backgroundColor: Colors.white,
          selectedItemColor: AppColors.corporateNavy,
          unselectedItemColor: AppColors.textSecondary,
          selectedLabelStyle: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
          ),
          unselectedLabelStyle: const TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w500,
          ),
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home_rounded),
              label: 'হোম',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.work_outline_rounded),
              activeIcon: Icon(Icons.work_rounded),
              label: 'চাকরি',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.track_changes_outlined),
              activeIcon: Icon(Icons.track_changes_rounded),
              label: 'ট্র্যাকিং',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.manage_accounts_outlined),
              activeIcon: Icon(Icons.manage_accounts_rounded),
              label: 'পোর্টাল',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHomeTab(AppLocalizations? l10n) {
    return RefreshIndicator(
      onRefresh: _checkBackendStatus,
      color: AppColors.corporateNavy,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Backend Connectivity & Status Banner
            _buildConnectivityBanner(l10n),
            const SizedBox(height: 12),

            // 2. Hero Section (Matching website hero-section.tsx)
            HomeHeroCard(
              onSearch: (q) => _navigateToJobsWithFilter(search: q),
              onFindJobsTap: () => setState(() => _selectedTabIndex = 1),
              onTrackFileTap: () => setState(() => _selectedTabIndex = 2),
              onPortalLoginTap: () => setState(() => _selectedTabIndex = 3),
            ),
            const SizedBox(height: 20),

            // 3. Featured Job Circulars (Matching jobs-preview-section.tsx)
            HomeFeaturedJobs(
              jobs: const [],
              onViewAllTap: () => setState(() => _selectedTabIndex = 1),
            ),
            const SizedBox(height: 22),

            // 4. Popular Destination Countries (Matching countries-section.tsx)
            HomeDestinationsSection(
              onCountryTap: (code) => _navigateToJobsWithFilter(countryCode: code),
            ),
            const SizedBox(height: 22),

            // 5. Quick Application Tracking Card (Preserved for tests & instant lookup)
            AppCard(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(
                        Icons.search_rounded,
                        color: AppColors.corporateNavy,
                        size: 20,
                      ),
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
                  const SizedBox(height: 6),
                  const Text(
                    'Check the live status of your application or passport deployment.',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _trackingController,
                    decoration: const InputDecoration(
                      hintText: 'Enter Passport No. (e.g. A01234567 বা আবেদন নম্বর)',
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
                            content: Text(
                              'Please enter a passport number or application ID',
                            ),
                          ),
                        );
                      } else {
                        setState(() => _selectedTabIndex = 2);
                      }
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),

            // 6. Recruitment Process Roadmap (Matching how-it-works-section.tsx)
            const HomeProcessRoadmap(),
            const SizedBox(height: 22),

            // 7. Trust Pillars & FAQ (Matching trust-section & faq-section)
            const HomeTrustAndFaq(),
            const SizedBox(height: 20),

            // 8. Official Helpline & Office Address (Matching contact-cta-section.tsx)
            AppCard(
              backgroundColor: AppColors.goldLight,
              border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.warning.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.phone_in_talk_rounded,
                          color: AppColors.warning,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
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
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                                color: AppColors.deepNavy,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'অফিসের ঠিকানা: ইসলামপুর মোড়, ডায়াবেটিস হাসপাতালের সামনে, নেত্রকোনা।\nসময়: শনি - বৃহস্পতি, সকাল ৯টা - সন্ধ্যা ৬টা।',
                    style: TextStyle(
                      fontSize: 10.5,
                      color: AppColors.textSecondary,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.success,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          icon: const Icon(Icons.chat_bubble_outline_rounded,
                              size: 15),
                          label: const Text('WhatsApp চ্যাট',
                              style: TextStyle(
                                  fontSize: 11, fontWeight: FontWeight.w700)),
                          onPressed: () =>
                              SupportLauncher.openWhatsApp(context: context),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.corporateNavy,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          icon:
                              const Icon(Icons.phone_in_talk_rounded, size: 15),
                          label: const Text('সরাসরি কল',
                              style: TextStyle(
                                  fontSize: 11, fontWeight: FontWeight.w700)),
                          onPressed: () =>
                              SupportLauncher.callHelpline(context: context),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // 9. Footnote
            const Center(
              child: Text(
                '© 2026 SHAKIL TRAVELS • RL-2579 • Official Mobile Portal',
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.textMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildConnectivityBanner(AppLocalizations? l10n) {
    if (_isCheckingBackend) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.surfaceWhite,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: const Row(
          children: [
            SizedBox(
              width: 12,
              height: 12,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: 8),
            Text(
              'Connecting to SHAKIL TRAVELS ERP...',
              style: TextStyle(fontSize: 11.5, color: AppColors.textSecondary),
            ),
          ],
        ),
      );
    }

    final isHealthy = _isBackendHealthy ?? false;
    final bg = isHealthy ? AppColors.successLight : AppColors.warningLight;
    final fg = isHealthy ? AppColors.success : AppColors.warning;
    final icon =
        isHealthy ? Icons.cloud_done_rounded : Icons.cloud_queue_rounded;
    final text = isHealthy
        ? 'Connected to SHAKILWORK ERP'
        : 'Backend server unreachable. Tap to retry.';

    return InkWell(
      onTap: _checkBackendStatus,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(icon, size: 14, color: fg),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                  color: fg,
                ),
              ),
            ),
            if (!isHealthy) Icon(Icons.refresh_rounded, size: 14, color: fg),
          ],
        ),
      ),
    );
  }

  void _showHelplineDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.phone_in_talk_rounded, color: AppColors.success),
            SizedBox(width: 8),
            Text(
              'সরাসরি যোগাযোগ',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'শাকিল ট্রাভেলস হেল্পলাইন ও অফিস:',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            SizedBox(height: 10),
            Text(
              '📞 হটলাইন: 01913-681771',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 4),
            Text(
              '📱 বিকল্প নম্বর: 01604-836148',
              style: TextStyle(fontSize: 13, color: AppColors.textPrimary),
            ),
            SizedBox(height: 8),
            Text(
              '📍 ঠিকানা: ইসলামপুর মোড়, ডায়াবেটিস হাসপাতালের সামনে, নেত্রকোনা।',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
        ),
        actions: [
          TextButton.icon(
            icon: const Icon(Icons.chat_bubble_outline_rounded,
                color: AppColors.success, size: 16),
            label: const Text('WhatsApp',
                style: TextStyle(
                    color: AppColors.success, fontWeight: FontWeight.bold)),
            onPressed: () {
              Navigator.pop(ctx);
              SupportLauncher.openWhatsApp(context: context);
            },
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.corporateNavy,
              foregroundColor: Colors.white,
            ),
            icon: const Icon(Icons.phone_in_talk_rounded, size: 16),
            label: const Text('কল দিন'),
            onPressed: () {
              Navigator.pop(ctx);
              SupportLauncher.callHelpline(context: context);
            },
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('বন্ধ করুন'),
          ),
        ],
      ),
    );
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
