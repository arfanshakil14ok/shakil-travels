import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/candidate/data/candidate_repository.dart';

class ApplicationDetailsScreen extends StatefulWidget {
  final String applicationId;
  final String applicationCode;
  final CandidateRepository? repository;

  const ApplicationDetailsScreen({
    super.key,
    required this.applicationId,
    required this.applicationCode,
    this.repository,
  });

  @override
  State<ApplicationDetailsScreen> createState() =>
      _ApplicationDetailsScreenState();
}

class _ApplicationDetailsScreenState extends State<ApplicationDetailsScreen> {
  late final CandidateRepository _repository;
  bool _isLoading = true;
  String? _errorMessage;

  Map<String, dynamic>? _applicationData;

  @override
  void initState() {
    super.initState();
    _repository =
        widget.repository ?? CandidateRepository(apiClient: ApiClient());
    _fetchDetails();
  }

  Future<void> _fetchDetails() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final appDetails = await _repository.getApplicationDetails(
        widget.applicationId,
      );
      Map<String, dynamic>? timeline;

      final processingCase =
          appDetails['processingCase'] as Map<String, dynamic>?;
      final processingCaseId = processingCase?['id']?.toString() ??
          appDetails['processingCaseId']?.toString();

      if (processingCaseId != null && processingCaseId.isNotEmpty) {
        try {
          timeline = await _repository.getProcessingTimeline(processingCaseId);
          if (timeline.isNotEmpty) {
            appDetails['timeline'] = timeline;
          }
        } catch (_) {
          // If processing timeline endpoint is not yet populated, use fallback stage mapping
        }
      }

      if (mounted) {
        setState(() {
          _applicationData = appDetails;
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
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: Text('আবেদন #${widget.applicationCode}'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _isLoading ? null : _fetchDetails,
            tooltip: 'রিফ্রেশ করুন',
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: LoadingIndicator(
          message: 'আবেদনের সর্বশেষ তথ্য ও ট্র্যাকার লোড হচ্ছে...',
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ErrorView(message: _errorMessage!, onRetry: _fetchDetails),
        ),
      );
    }

    final app = _applicationData ?? {};
    final job = (app['job'] as Map<String, dynamic>?) ?? {};
    final country = (job['country'] as Map<String, dynamic>?) ?? {};
    final employer = (job['employer'] as Map<String, dynamic>?) ?? {};
    final currentStage = app['currentStage']?.toString() ??
        app['status']?.toString() ??
        'SELECTED';

    return RefreshIndicator(
      onRefresh: _fetchDetails,
      color: AppColors.corporateNavy,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildJobHeaderCard(job, country, employer, currentStage),
          const SizedBox(height: 14),
          _buildNextActionCard(currentStage),
          const SizedBox(height: 18),
          _buildTimelineHeader(),
          const SizedBox(height: 10),
          _buildInteractive13StageTimeline(currentStage),
          const SizedBox(height: 16),
          _buildImportantNoticeCard(),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildJobHeaderCard(
    Map<String, dynamic> job,
    Map<String, dynamic> country,
    Map<String, dynamic> employer,
    String stage,
  ) {
    final title = job['title']?.toString() ?? 'নিয়োগ বিজ্ঞপ্তি';
    final countryName = country['name']?.toString() ?? 'Overseas';
    final countryFlag =
        country['flag']?.toString() ?? country['flagEmoji']?.toString() ?? '✈️';
    final company = employer['companyName']?.toString();
    final salary = job['salaryMin'] != null
        ? '${job['salaryMin']} ${job['currency'] ?? 'BDT'}'
        : 'আলোচনা সাপেক্ষে';

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.pageBackground,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'ট্র্যাকিং কোড: ${widget.applicationCode}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.corporateNavy,
                  ),
                ),
              ),
              StatusBadge.processing(stage),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppColors.deepNavy,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(countryFlag, style: const TextStyle(fontSize: 18)),
              const SizedBox(width: 8),
              Text(
                countryName,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              if (company != null) ...[
                const Text(
                  ' • ',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                Flexible(
                  child: Text(
                    company,
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
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.corporateNavy.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'প্রস্তাবিত বেতন (Basic Salary):',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  salary,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.success,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNextActionCard(String stage) {
    final nextAction = _getNextActionForStage(stage);

    return AppCard(
      backgroundColor: AppColors.goldLight,
      border: Border.all(color: AppColors.gold.withValues(alpha: 0.5)),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(
                Icons.touch_app_rounded,
                color: AppColors.warning,
                size: 20,
              ),
              SizedBox(width: 8),
              Text(
                'পরবর্তী করণীয় পদক্ষেপ (Next Action)',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.warning,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            nextAction['titleBn']!,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.deepNavy,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            nextAction['descBn']!,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textPrimary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            nextAction['descEn']!,
            style: const TextStyle(
              fontSize: 11,
              fontStyle: FontStyle.italic,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineHeader() {
    return const Row(
      children: [
        Icon(Icons.timeline_rounded, color: AppColors.corporateNavy, size: 22),
        SizedBox(width: 8),
        Text(
          'সরকারি ১৩-ধাপ প্রবাস অগ্রগতি ট্র্যাকার',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: AppColors.deepNavy,
          ),
        ),
      ],
    );
  }

  Widget _buildInteractive13StageTimeline(String currentStage) {
    const stages = CandidateRepository.official13Stages;
    final currentIndex = _findStageIndex(currentStage, stages);

    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        children: List.generate(stages.length, (index) {
          final s = stages[index];
          final isCompleted = index < currentIndex;
          final isCurrent = index == currentIndex;
          final isLast = index == stages.length - 1;

          return _TimelineStepItem(
            stepNumber: index + 1,
            labelEn: s['label']!,
            labelBn: s['labelBn']!,
            descBn: s['descBn']!,
            isCompleted: isCompleted,
            isCurrent: isCurrent,
            isLast: isLast,
          );
        }),
      ),
    );
  }

  int _findStageIndex(String stage, List<Map<String, String>> stages) {
    final normalized = stage.toUpperCase().trim();
    for (int i = 0; i < stages.length; i++) {
      if (stages[i]['key'] == normalized) {
        return i;
      }
    }
    // Mapping common variants
    if (normalized == 'NEW' ||
        normalized == 'SUBMITTED' ||
        normalized == 'APPLIED') {
      return 0;
    }
    if (normalized.contains('DOC')) return 1;
    if (normalized.contains('MEDICAL_PENDING')) return 3;
    if (normalized.contains('MEDICAL')) return 4;
    if (normalized.contains('VISA_SUBMITTED') ||
        normalized.contains('EMBASSY')) {
      return 6;
    }
    if (normalized.contains('VISA')) return 7;
    if (normalized.contains('CLEARANCE') || normalized.contains('BMET')) {
      return 9;
    }
    if (normalized.contains('TICKET') || normalized.contains('FLIGHT')) {
      return 10;
    }
    if (normalized.contains('BRIEFING')) return 11;
    if (normalized.contains('DEPARTED') || normalized.contains('JOINED')) {
      return 12;
    }

    return 0;
  }

  Map<String, String> _getNextActionForStage(String stage) {
    final norm = stage.toUpperCase();
    if (norm.contains('DOC')) {
      return {
        'titleBn': 'কাগজপত্র জমা দিন',
        'descBn':
            'আপনার পাসপোর্ট, ছবি ও শিক্ষাগত যোগ্যতার সনদপত্র "ডকুমেন্টস" সেকশনে আপলোড করুন অথবা অফিসে জমা দিন।',
        'descEn':
            'Please upload your passport, photo and credentials to Document Hub or submit to office.',
      };
    } else if (norm.contains('MEDICAL')) {
      return {
        'titleBn': 'অনুমোদিত গামকা মেডিকেলে উপস্থিত থাকুন',
        'descBn':
            'নির্ধারিত মেডিকেল সেন্টারে পাসপোর্ট মূল কপি সহ উপস্থিত হয়ে স্বাস্থ্য পরীক্ষা সম্পন্ন করুন।',
        'descEn':
            'Attend the designated GAMCA medical center with your original passport.',
      };
    } else if (norm.contains('VISA')) {
      return {
        'titleBn': 'ভিসা প্রসেসিং চলমান',
        'descBn':
            'আপনার ভিসা দূতাবাসে স্ট্যাম্পিং প্রক্রিয়ায় রয়েছে। দূতাবাস কর্তৃক অনুমতি প্রাপ্তি পর্যন্ত অপেক্ষা করুন।',
        'descEn':
            'Your visa is undergoing stamping at the embassy. Please await official approval.',
      };
    } else if (norm.contains('CLEARANCE') || norm.contains('BMET')) {
      return {
        'titleBn': 'বিএমইটি বায়োমেট্রিক ও স্মার্ট কার্ড',
        'descBn':
            'জনশক্তি ব্যুরোর বহির্গমন ছাড়পত্রের কাজ চলছে। প্রস্তুত হলে স্মার্ট কার্ডের আপডেট পাবেন।',
        'descEn':
            'BMET Emigration clearance is underway. Smart card update will follow shortly.',
      };
    } else if (norm.contains('TICKET')) {
      return {
        'titleBn': 'ফ্লাইট টিকিট ও প্রস্তুতি',
        'descBn':
            'আপনার বিমান টিকিট ইস্যু হয়েছে। ফ্লাইটের সময়সূচী যাচাই করে প্রবাসযাত্রার ব্যাগেজ প্রস্তুত করুন।',
        'descEn':
            'Flight ticket has been confirmed. Review flight details and prepare your baggage.',
      };
    } else if (norm.contains('DEPARTURE')) {
      return {
        'titleBn': 'অফিসে প্রি-ডিপার্চার ব্রিফিং',
        'descBn':
            'যাত্রা শুরুর পূর্বে শাকিল ট্রাভেলস অফিসে এসে নিয়মাবলী ও প্রবাসী নির্দেশিকা ব্রিফিং গ্রহণ করুন।',
        'descEn':
            'Attend mandatory pre-departure briefing at Shakil Travels office before travel.',
      };
    } else {
      return {
        'titleBn': 'শাকিল ট্রাভেলস এর পরবর্তী নির্দেশনার অপেক্ষা করুন',
        'descBn':
            'আপনার ফাইলটি কর্মকর্তাদের তত্ত্বাবধানে নিয়মতান্ত্রিকভাবে এগোচ্ছে। যেকোনো প্রয়োজনে হেল্পলাইনে যোগাযোগ করুন।',
        'descEn':
            'Your dossier is progressing systematically. Contact office for assistance.',
      };
    }
  }

  Widget _buildImportantNoticeCard() {
    return AppCard(
      padding: const EdgeInsets.all(14),
      backgroundColor: AppColors.surfaceWhite,
      border: Border.all(color: AppColors.cardBorder),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.security_rounded,
            color: AppColors.corporateNavy,
            size: 22,
          ),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'শাকিল ট্রাভেলস (RL-2579) সরাসরি সরকারি বিএমইটি ও দূতাবাস অনুমোদিত নিয়মে কাজ করে। কোনো প্রকার মধ্যস্বত্বভোগী বা দালালের সাথে লেনদেন করবেন না।',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TimelineStepItem extends StatelessWidget {
  final int stepNumber;
  final String labelEn;
  final String labelBn;
  final String descBn;
  final bool isCompleted;
  final bool isCurrent;
  final bool isLast;

  const _TimelineStepItem({
    required this.stepNumber,
    required this.labelEn,
    required this.labelBn,
    required this.descBn,
    required this.isCompleted,
    required this.isCurrent,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    Color indicatorBg;
    Color indicatorBorder;
    Widget icon;

    if (isCompleted) {
      indicatorBg = AppColors.success;
      indicatorBorder = AppColors.success;
      icon = const Icon(Icons.check_rounded, color: Colors.white, size: 14);
    } else if (isCurrent) {
      indicatorBg = AppColors.corporateNavy;
      indicatorBorder = AppColors.corporatePink;
      icon = Text(
        '$stepNumber',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      );
    } else {
      indicatorBg = AppColors.pageBackground;
      indicatorBorder = AppColors.cardBorder;
      icon = Text(
        '$stepNumber',
        style: const TextStyle(
          color: AppColors.textDisabled,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      );
    }

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline indicator with connecting line
          SizedBox(
            width: 32,
            child: Column(
              children: [
                Container(
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(
                    color: indicatorBg,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: indicatorBorder,
                      width: isCurrent ? 2.5 : 1.5,
                    ),
                    boxShadow: isCurrent
                        ? [
                            BoxShadow(
                              color: AppColors.corporateNavy
                                  .withValues(alpha: 0.25),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : null,
                  ),
                  child: Center(child: icon),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: isCompleted
                          ? AppColors.success
                          : AppColors.cardBorder,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Content
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          labelBn,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight:
                                isCurrent ? FontWeight.w800 : FontWeight.w600,
                            color: isCurrent
                                ? AppColors.deepNavy
                                : isCompleted
                                    ? AppColors.textPrimary
                                    : AppColors.textSecondary,
                          ),
                        ),
                      ),
                      if (isCurrent) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color:
                                AppColors.corporatePink.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'চলমান ধাপ',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: AppColors.corporateNavy,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    labelEn,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: isCurrent
                          ? AppColors.corporateNavy
                          : AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    descBn,
                    style: TextStyle(
                      fontSize: 12,
                      color: isCurrent
                          ? AppColors.textPrimary
                          : AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
