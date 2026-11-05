import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/notifications/notifications_sheet.dart';
import '../../../../shared/widgets/app_app_bar.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/auth/data/session_model.dart';
import 'package:shakil_travels/features/candidate/data/candidate_models.dart';
import 'package:shakil_travels/features/candidate/data/candidate_repository.dart';
import 'application_details_screen.dart';
import 'candidate_payments_screen.dart';
import 'job_details_screen.dart';

/// SHAKIL TRAVELS Candidate Executive Dashboard
/// Enterprise-grade mobile command center for candidates.
/// Completely backed by authenticated ERP Next.js API endpoints.
class CandidateDashboardScreen extends StatefulWidget {
  final SessionModel session;
  final CandidateRepository? repository;
  final void Function(int)? onNavigateTab;

  const CandidateDashboardScreen({
    super.key,
    required this.session,
    this.repository,
    this.onNavigateTab,
  });

  @override
  State<CandidateDashboardScreen> createState() =>
      _CandidateDashboardScreenState();
}

class _CandidateDashboardScreenState extends State<CandidateDashboardScreen> {
  late final CandidateRepository _repository;
  bool _isLoading = true;
  String? _errorMessage;

  CandidateProfileModel? _profile;
  List<CandidateApplicationModel> _applications = [];
  List<CandidateDocumentModel> _documents = [];
  CandidateFinanceSummaryModel? _financeSummary;
  List<JobCircularModel> _recentJobs = [];
  List<Map<String, dynamic>> _interviews = [];

  @override
  void initState() {
    super.initState();
    _repository =
        widget.repository ?? CandidateRepository(apiClient: ApiClient());
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final profileFuture = _repository.getProfile();
      final appsFuture = _repository.getMyApplications();
      final docsFuture = _repository.getDocuments();
      final financeFuture = _repository.getFinanceSummary().catchError((_) {
        return const CandidateFinanceSummaryModel(
          totalInvoiced: 0.0,
          totalPaid: 0.0,
          totalDue: 0.0,
          runningBalance: 0.0,
          invoices: [],
          payments: [],
        );
      });
      final jobsFuture = _repository.getJobs(limit: 3).catchError((_) => <JobCircularModel>[]);
      final interviewsFuture = _repository.getCandidateInterviews().catchError((_) => <Map<String, dynamic>>[]);

      final results = await Future.wait([
        profileFuture,
        appsFuture,
        docsFuture,
        financeFuture,
        jobsFuture,
        interviewsFuture,
      ]);

      if (mounted) {
        final docsData = results[2] as Map<String, dynamic>;
        setState(() {
          _profile = results[0] as CandidateProfileModel;
          _applications = results[1] as List<CandidateApplicationModel>;
          _documents = (docsData['documents'] as List<CandidateDocumentModel>?) ?? [];
          _financeSummary = results[3] as CandidateFinanceSummaryModel;
          _recentJobs = results[4] as List<JobCircularModel>;
          _interviews = results[5] as List<Map<String, dynamic>>;
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
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.pageBackground,
        body: Center(
          child: LoadingIndicator(
            message: 'ক্যান্ডিডেট ড্যাশবোর্ড লোড হচ্ছে...',
          ),
        ),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        backgroundColor: AppColors.pageBackground,
        body: ErrorView(
          title: 'সংযোগ সমস্যা',
          message: _errorMessage!,
          onRetry: _loadDashboardData,
        ),
      );
    }

    final p = _profile!;
    final activeApp = _applications.isNotEmpty ? _applications.first : null;

    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppAppBar(
        title: 'প্রার্থী পোর্টাল ড্যাশবোর্ড',
        subtitle: 'লাইসেন্স: RL-2579 • শাকিল ট্রাভেলস',
        showBackButton: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded),
            color: AppColors.surfaceWhite,
            tooltip: 'বিজ্ঞপ্তি (Notifications)',
            onPressed: () => NotificationsSheet.show(context),
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            color: AppColors.surfaceWhite,
            tooltip: 'রিফ্রেশ করুন',
            onPressed: _loadDashboardData,
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.corporateNavy,
          onRefresh: _loadDashboardData,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Candidate Bio Header Card
                _buildCandidateHeaderCard(p),
                const SizedBox(height: AppSpacing.lg),

                // 2. Profile Completion Bar
                _buildProfileCompletionCard(p),
                const SizedBox(height: AppSpacing.lg),

                // 3. Upcoming Interview Schedule (if scheduled)
                if (_interviews.isNotEmpty) ...[
                  _buildInterviewScheduleCard(_interviews.first),
                  const SizedBox(height: AppSpacing.lg),
                ],

                // 4. Active Application / Deployment Milestone Card
                if (activeApp != null) ...[
                  _buildActiveApplicationCard(activeApp),
                  const SizedBox(height: AppSpacing.lg),
                ] else ...[
                  _buildNoApplicationCard(),
                  const SizedBox(height: AppSpacing.lg),
                ],

                // 5. Document Verification Status Card
                _buildDocumentVerificationCard(),
                const SizedBox(height: AppSpacing.lg),

                // 6. Payment & Financial Summary Card
                if (_financeSummary != null) ...[
                  _buildPaymentSummaryCard(_financeSummary!),
                  const SizedBox(height: AppSpacing.lg),
                ],

                // 7. Quick Action Navigation Shortcuts
                _buildSectionTitle('রিক্রুটমেন্ট সার্ভিসেস (Quick Actions)', Icons.apps_rounded),
                const SizedBox(height: AppSpacing.sm),
                _buildQuickServiceGrid(),
                const SizedBox(height: AppSpacing.xl),

                // 8. Available Jobs Preview (Top Overseas Openings)
                if (_recentJobs.isNotEmpty) ...[
                  _buildRecentJobsSection(),
                  const SizedBox(height: AppSpacing.xl),
                ],

                // 9. Official Helpline & Regulatory Footnote
                _buildHelplineCard(),
                const SizedBox(height: AppSpacing.lg),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: AppColors.corporateNavy, size: 18),
        const SizedBox(width: AppSpacing.sm),
        Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.deepNavy,
          ),
        ),
      ],
    );
  }

  // ==============================================================================
  // 1. CANDIDATE BIO HEADER CARD
  // ==============================================================================
  Widget _buildCandidateHeaderCard(CandidateProfileModel p) {
    return AppCard(
      backgroundColor: AppColors.corporateNavy,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: AppColors.corporatePink.withValues(alpha: 0.3),
            child: const Icon(
              Icons.person_rounded,
              color: AppColors.surfaceWhite,
              size: 36,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Text(
                        p.fullName,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: AppColors.surfaceWhite,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    StatusBadge.verified(p.status),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'আইডি: ${p.applicantNumber}',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.corporatePink,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
                if (p.profession != null && p.profession!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    'ট্রেড: ${p.profession}',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.surfaceWhite.withValues(alpha: 0.8),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ==============================================================================
  // 2. PROFILE COMPLETION PROGRESS
  // ==============================================================================
  Widget _buildProfileCompletionCard(CandidateProfileModel p) {
    final percent = p.profileCompletion;
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'প্রোফাইল সম্পূর্ণতা (Profile Completion)',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                '$percent%',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.corporateNavy,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: percent / 100.0,
              minHeight: 8,
              backgroundColor: AppColors.pageBackground,
              valueColor: AlwaysStoppedAnimation<Color>(
                percent > 75 ? AppColors.success : AppColors.warning,
              ),
            ),
          ),
          if (p.missingFields.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'বাকি তথ্য: ${p.missingFields.take(2).join(', ')}',
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ==============================================================================
  // 3. UPCOMING INTERVIEW CARD
  // ==============================================================================
  Widget _buildInterviewScheduleCard(Map<String, dynamic> interview) {
    final job = interview['job'] as Map<String, dynamic>? ?? {};
    final scheduledAt = interview['scheduledAt']?.toString() ?? 'TBD';
    final dateDisplay = scheduledAt.split('T').first;
    final venue = interview['venue']?.toString() ?? 'শাকিল ট্রাভেলস হেড অফিস';

    return AppCard(
      backgroundColor: AppColors.warningLight,
      border: Border.all(color: AppColors.warning.withValues(alpha: 0.5)),
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.event_available_rounded, color: AppColors.warning, size: 20),
              SizedBox(width: 8),
              Text(
                'আসন্ন ইন্টারভিউ শিডিউল (Upcoming Interview)',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.deepNavy,
                ),
              ),
            ],
          ),
          const Divider(height: 18, color: AppColors.cardBorder),
          Text(
            job['title']?.toString() ?? 'Overseas Interview Session',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.calendar_today_rounded, size: 14, color: AppColors.warning),
              const SizedBox(width: 6),
              Text(
                'তারিখ: $dateDisplay',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              ),
              const SizedBox(width: 14),
              const Icon(Icons.location_on_rounded, size: 14, color: AppColors.warning),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  venue,
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==============================================================================
  // 4. ACTIVE APPLICATION CARD
  // ==============================================================================
  Widget _buildActiveApplicationCard(CandidateApplicationModel app) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(
                    Icons.flight_takeoff_rounded,
                    color: AppColors.corporateNavy,
                    size: 20,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'চলমান প্রবাস আবেদন (Active Deployment)',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
              StatusBadge.processing(app.effectiveStage),
            ],
          ),
          const Divider(height: 20, color: AppColors.cardBorder),
          Text(
            app.jobTitle ?? 'Overseas Position',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.deepNavy,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              if (app.countryFlag != null) ...[
                Text(app.countryFlag!, style: const TextStyle(fontSize: 16)),
                const SizedBox(width: 6),
              ],
              Text(
                'গন্তব্য: ${app.countryName ?? 'Overseas'}',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
              if (app.employerName != null) ...[
                const Text(
                  ' • ',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                Flexible(
                  child: Text(
                    app.employerName!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          AppButton(
            text: 'বিস্তারিত ও ১৩-ধাপ ট্র্যাকার দেখুন',
            icon: Icons.alt_route_rounded,
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ApplicationDetailsScreen(
                    applicationId: app.id,
                    applicationCode: app.applicationCode,
                    repository: _repository,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildNoApplicationCard() {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        children: [
          const Icon(
            Icons.work_outline_rounded,
            size: 40,
            color: AppColors.corporatePink,
          ),
          const SizedBox(height: 10),
          const Text(
            'আপনার কোনো সক্রিয় আবেদন নেই',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          const Text(
            'বর্তমানে বিভিন্ন দেশে সরকারি লাইসেন্সকৃত চাকরির চাহিদাপত্র উন্মুক্ত রয়েছে। সার্কুলার দেখে আবেদন করুন।',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          AppButton(
            text: 'চাকরির সার্কুলার দেখুন',
            icon: Icons.search_rounded,
            onPressed: () {
              widget.onNavigateTab?.call(1); // Jump to Jobs tab
            },
          ),
        ],
      ),
    );
  }

  // ==============================================================================
  // 5. DOCUMENT VERIFICATION STATUS CARD
  // ==============================================================================
  Widget _buildDocumentVerificationCard() {
    final total = _documents.length;
    final verified = _documents.where((d) => d.isVerified).length;
    final underReview = _documents.where((d) => d.isUnderReview).length;
    final rejected = _documents.where((d) => d.isRejected).length;

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.verified_user_rounded, color: AppColors.corporateNavy, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'ডকুমেন্ট ভেরিফিকেশন (Document Compliance)',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.deepNavy,
                    ),
                  ),
                ],
              ),
              Text(
                'মোট: $total টি',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.corporateNavy),
              ),
            ],
          ),
          const Divider(height: 18, color: AppColors.cardBorder),
          Row(
            children: [
              Expanded(
                child: _buildDocMiniStat('অনুমোদিত', '$verified', AppColors.success, Icons.check_circle_rounded),
              ),
              Expanded(
                child: _buildDocMiniStat('যাচাইাধীন', '$underReview', AppColors.warning, Icons.schedule_rounded),
              ),
              Expanded(
                child: _buildDocMiniStat('আপলোড আবশ্যক', '$rejected', AppColors.error, Icons.error_rounded),
              ),
            ],
          ),
          const SizedBox(height: 12),
          AppButton(
            text: 'ডকুমেন্ট ও পাসপোর্ট আপলোড করুন',
            icon: Icons.upload_file_rounded,
            variant: AppButtonVariant.outline,
            onPressed: () => widget.onNavigateTab?.call(3), // Jump to Documents tab
          ),
        ],
      ),
    );
  }

  Widget _buildDocMiniStat(String label, String count, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(height: 4),
          Text(
            count,
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: color),
          ),
          Text(
            label,
            style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // ==============================================================================
  // 6. PAYMENT & BILLING SUMMARY CARD
  // ==============================================================================
  Widget _buildPaymentSummaryCard(CandidateFinanceSummaryModel fin) {
    return AppCard(
      backgroundColor: AppColors.surfaceWhite,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.account_balance_wallet_rounded, color: AppColors.corporateNavy, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'পেমেন্ট ও লেজার সারসংক্ষেপ (Finance)',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.deepNavy,
                    ),
                  ),
                ],
              ),
              StatusBadge(
                label: fin.totalDue <= 0 ? 'পরিশোধিত' : 'বকেয়া রয়েছে',
                backgroundColor: fin.totalDue <= 0 ? AppColors.successLight : AppColors.warningLight,
                textColor: fin.totalDue <= 0 ? AppColors.success : AppColors.warning,
                icon: fin.totalDue <= 0 ? Icons.check_circle_rounded : Icons.pending_rounded,
              ),
            ],
          ),
          const Divider(height: 18, color: AppColors.cardBorder),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildFinanceMetric('মোট বিলিং (Invoiced)', fin.totalInvoiced, AppColors.corporateNavy),
              _buildFinanceMetric('পরিশোধিত (Paid)', fin.totalPaid, AppColors.success),
              _buildFinanceMetric('বকেয়া (Due)', fin.totalDue, fin.totalDue > 0 ? AppColors.error : AppColors.textSecondary),
            ],
          ),
          const SizedBox(height: 12),
          AppButton(
            text: 'ইনভয়েস ও রসিদসমূহ দেখুন',
            icon: Icons.receipt_long_rounded,
            variant: AppButtonVariant.outline,
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => CandidatePaymentsScreen(repository: _repository),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildFinanceMetric(String title, double amount, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 2),
        Text(
          '৳ ${_formatNumber(amount)}',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
      ],
    );
  }

  String _formatNumber(double val) {
    if (val == 0) return '0.00';
    return val.toStringAsFixed(2);
  }

  // ==============================================================================
  // 7. QUICK ACTION MODULES GRID
  // ==============================================================================
  Widget _buildQuickServiceGrid() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _ServiceCard(
                title: 'চাকরির সার্কুলার',
                subtitle: 'দেশ ও ট্রেড অনুযায়ী',
                icon: Icons.travel_explore_rounded,
                color: AppColors.corporateNavy,
                onTap: () => widget.onNavigateTab?.call(1),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: _ServiceCard(
                title: 'আমার আবেদনসমূহ',
                subtitle: '১৩-ধাপ পাইপলাইন ট্র্যাকিং',
                icon: Icons.assignment_rounded,
                color: AppColors.corporatePinkHover,
                onTap: () => widget.onNavigateTab?.call(2),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            Expanded(
              child: _ServiceCard(
                title: 'ডকুমেন্ট ও ফাইল',
                subtitle: 'পাসপোর্ট ও সনদপত্র',
                icon: Icons.folder_shared_rounded,
                color: AppColors.warning,
                onTap: () => widget.onNavigateTab?.call(3),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: _ServiceCard(
                title: 'প্রোফাইল সেটিংস',
                subtitle: 'ব্যক্তিগত তথ্য ও নিরাপত্তা',
                icon: Icons.person_rounded,
                color: AppColors.success,
                onTap: () => widget.onNavigateTab?.call(4),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ==============================================================================
  // 8. AVAILABLE JOBS PREVIEW
  // ==============================================================================
  Widget _buildRecentJobsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildSectionTitle('হালনাগাদ চাকরির চাহিদাপত্র (Live Circulars)', Icons.work_rounded),
            TextButton(
              onPressed: () => widget.onNavigateTab?.call(1),
              child: const Text('সব দেখুন', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xs),
        ..._recentJobs.map((job) => _buildJobCardItem(job)),
      ],
    );
  }

  Widget _buildJobCardItem(JobCircularModel job) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: AppCard(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => JobDetailsScreen(
                job: job,
                repository: _repository,
              ),
            ),
          );
        },
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.pageBackground,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                job.countryFlag ?? '✈️',
                style: const TextStyle(fontSize: 22),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    job.title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.deepNavy,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${job.countryName} • পদসংখ্যা: ${job.vacancies}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textDisabled),
          ],
        ),
      ),
    );
  }

  // ==============================================================================
  // 9. OFFICIAL HELPLINE & FOOTNOTE
  // ==============================================================================
  Widget _buildHelplineCard() {
    return AppCard(
      backgroundColor: AppColors.goldLight,
      border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: const Row(
        children: [
          Icon(
            Icons.support_agent_rounded,
            color: AppColors.warning,
            size: 26,
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'শাকিল ট্রাভেলস অফিসিয়াল ডেস্ক (RL-2579)',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.warning,
                  ),
                ),
                Text(
                  'হেল্পলাইন: +880 1913-681771',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppColors.deepNavy,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ServiceCard({
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
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: const TextStyle(
              fontSize: 13,
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
