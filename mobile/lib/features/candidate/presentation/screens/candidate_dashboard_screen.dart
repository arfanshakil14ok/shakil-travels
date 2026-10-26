import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/auth/data/session_model.dart';
import 'package:shakil_travels/features/candidate/data/candidate_models.dart';
import 'package:shakil_travels/features/candidate/data/candidate_repository.dart';
import 'application_details_screen.dart';

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

      final results = await Future.wait([profileFuture, appsFuture]);
      if (mounted) {
        setState(() {
          _profile = results[0] as CandidateProfileModel;
          _applications = results[1] as List<CandidateApplicationModel>;
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
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.corporateNavy,
          onRefresh: _loadDashboardData,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Candidate Bio Header Card
                _buildCandidateHeaderCard(p),
                const SizedBox(height: 16),

                // 2. Profile Completion Bar
                _buildProfileCompletionCard(p),
                const SizedBox(height: 16),

                // 3. Active Application / Deployment Milestone Card
                if (activeApp != null) ...[
                  _buildActiveApplicationCard(activeApp),
                  const SizedBox(height: 16),
                ] else ...[
                  _buildNoApplicationCard(),
                  const SizedBox(height: 16),
                ],

                // 4. Quick Action Modules Grid
                const Text(
                  'রিক্রুটমেন্ট মডিউলসমূহ (Quick Services)',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 10),
                _buildQuickServiceGrid(),
                const SizedBox(height: 20),

                // 5. Official Helpline & Regulatory Footnote
                _buildHelplineCard(),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCandidateHeaderCard(CandidateProfileModel p) {
    return AppCard(
      backgroundColor: AppColors.corporateNavy,
      padding: const EdgeInsets.all(18),
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
          const SizedBox(width: 14),
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

  Widget _buildProfileCompletionCard(CandidateProfileModel p) {
    final percent = p.profileCompletion;
    return AppCard(
      padding: const EdgeInsets.all(16),
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

  Widget _buildActiveApplicationCard(CandidateApplicationModel app) {
    return AppCard(
      padding: const EdgeInsets.all(16),
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
      padding: const EdgeInsets.all(18),
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

  Widget _buildQuickServiceGrid() {
    return Row(
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
        const SizedBox(width: 12),
        Expanded(
          child: _ServiceCard(
            title: 'আমার আবেদনসমূহ',
            subtitle: 'অগ্রগতি ট্র্যাকিং',
            icon: Icons.assignment_rounded,
            color: AppColors.corporatePinkHover,
            onTap: () => widget.onNavigateTab?.call(2),
          ),
        ),
      ],
    );
  }

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
      padding: const EdgeInsets.all(14),
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
