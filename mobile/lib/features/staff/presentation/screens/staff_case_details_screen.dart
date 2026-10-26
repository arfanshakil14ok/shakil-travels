import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/candidate/data/candidate_repository.dart';
import 'package:shakil_travels/features/staff/data/staff_repository.dart';

class StaffCaseDetailsScreen extends StatefulWidget {
  final String caseId;
  final String processingCode;
  final StaffRepository? repository;

  const StaffCaseDetailsScreen({
    super.key,
    required this.caseId,
    required this.processingCode,
    this.repository,
  });

  @override
  State<StaffCaseDetailsScreen> createState() => _StaffCaseDetailsScreenState();
}

class _StaffCaseDetailsScreenState extends State<StaffCaseDetailsScreen> {
  late final StaffRepository _repository;
  bool _isLoading = true;
  bool _isTransitioning = false;
  String? _errorMessage;

  Map<String, dynamic>? _caseData;
  final _transitionNotesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? StaffRepository(apiClient: ApiClient());
    _loadDetails();
  }

  @override
  void dispose() {
    _transitionNotesController.dispose();
    super.dispose();
  }

  Future<void> _loadDetails() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await _repository.getProcessingCaseDetails(widget.caseId);
      if (mounted) {
        setState(() {
          _caseData = data;
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

  Future<void> _handleTransition(
    String targetStage,
    String stageTitleBn,
  ) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('ধাপ পরিবর্তন নিশ্চিতকরণ'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'আপনি কি নিশ্চিত যে ফাইলটি "$stageTitleBn" ধাপে উন্নীত করতে চান?',
              style: const TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 12),
            const Text(
              'সার্ভার কর্তৃক সকল আবশ্যকীয় পূর্বশর্ত (ডকুমেন্ট, মেডিকেল, ভিসা বা ফি) স্বয়ংক্রিয়ভাবে যাচাই করা হবে।',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('বাতিল'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.corporateNavy,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'হ্যাঁ, পরিবর্তন করুন',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() {
      _isTransitioning = true;
    });

    try {
      await _repository.transitionCase(
        caseId: widget.caseId,
        targetStage: targetStage,
        notes: _transitionNotesController.text.trim().isEmpty
            ? null
            : _transitionNotesController.text.trim(),
      );

      _transitionNotesController.clear();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('ফাইলটি সফলভাবে "$stageTitleBn" ধাপে উন্নীত হয়েছে।'),
            backgroundColor: AppColors.success,
          ),
        );
        _loadDetails();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isTransitioning = false;
        });
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('ধাপ পরিবর্তন স্থগিত (Gate Blocked)'),
            content: Text(
              e.toString().replaceFirst('ApiException: ', ''),
              style: const TextStyle(fontSize: 13, height: 1.4),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('ঠিক আছে'),
              ),
            ],
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: Text('ফাইল #${widget.processingCode}'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _isLoading ? null : _loadDetails,
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
          message: 'প্রসেসিং কেসের বিস্তারিত তথ্য লোড হচ্ছে...',
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ErrorView(message: _errorMessage!, onRetry: _loadDetails),
        ),
      );
    }

    final data = _caseData ?? {};
    final applicant = (data['applicant'] as Map<String, dynamic>?) ?? {};
    final job = (data['job'] as Map<String, dynamic>?) ?? {};
    final country = (job['country'] as Map<String, dynamic>?) ?? {};
    final employer = (data['employer'] as Map<String, dynamic>?) ?? {};
    final currentStage = data['currentStage']?.toString() ?? 'SELECTED';
    final priority = data['priority']?.toString() ?? 'NORMAL';

    return RefreshIndicator(
      onRefresh: _loadDetails,
      color: AppColors.corporateNavy,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildDossierHeaderCard(
            applicant,
            job,
            country,
            employer,
            currentStage,
            priority,
          ),
          const SizedBox(height: 14),
          _buildStageTransitionCard(currentStage),
          const SizedBox(height: 18),
          _build13StageTimelineProgress(currentStage),
          const SizedBox(height: 18),
          _buildSubCasesSummary(data),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildDossierHeaderCard(
    Map<String, dynamic> applicant,
    Map<String, dynamic> job,
    Map<String, dynamic> country,
    Map<String, dynamic> employer,
    String stage,
    String priority,
  ) {
    final candidateName = applicant['fullName']?.toString() ?? 'Applicant';
    final applicantNo = applicant['applicantNumber']?.toString() ?? '';
    final passport = applicant['passportNumber']?.toString();
    final jobTitle = job['title']?.toString() ?? 'Overseas Position';
    final countryName = country['name']?.toString() ?? 'Overseas';
    final countryFlag = country['flag']?.toString() ?? '✈️';
    final company = employer['companyName']?.toString();

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.pageBackground,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'কেস কোড: ${widget.processingCode}',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.corporateNavy,
                  ),
                ),
              ),
              StatusBadge.processing(stage),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            candidateName,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppColors.deepNavy,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Text(
                'আইডি: $applicantNo',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
              if (passport != null) ...[
                const Text(
                  ' • ',
                  style: TextStyle(color: AppColors.textDisabled),
                ),
                Text(
                  'পাসপোর্ট: ${_maskPassport(passport)}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ],
          ),
          const Divider(height: 18, color: AppColors.cardBorder),
          Row(
            children: [
              Text(countryFlag, style: const TextStyle(fontSize: 18)),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      jobTitle,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.deepNavy,
                      ),
                    ),
                    Text(
                      '$countryName ${company != null ? '• $company' : ''}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStageTransitionCard(String currentStage) {
    final nextStages = _getLegalNextTransitions(currentStage);

    return AppCard(
      backgroundColor: AppColors.surfaceWhite,
      border: Border.all(color: AppColors.corporateNavy.withValues(alpha: 0.3)),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(
                Icons.alt_route_rounded,
                color: AppColors.corporateNavy,
                size: 20,
              ),
              SizedBox(width: 8),
              Text(
                'অপারেশনাল ধাপ পরিবর্তন (Server State Transition)',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: AppColors.deepNavy,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _transitionNotesController,
            decoration: InputDecoration(
              hintText: 'ধাপ পরিবর্তনের প্রাসঙ্গিক নোট বা বিবরণ লিখুন...',
              hintStyle: const TextStyle(
                fontSize: 12,
                color: AppColors.textDisabled,
              ),
              filled: true,
              fillColor: AppColors.pageBackground,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 8,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: AppColors.cardBorder),
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (nextStages.isEmpty)
            const Text(
              'এই ফাইলটি চূড়ান্ত ধাপে উন্নীত রয়েছে।',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.success,
                fontWeight: FontWeight.w600,
              ),
            )
          else ...[
            const Text(
              'অনুমোদিত পরবর্তী ধাপ নির্বাচন করুন:',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: nextStages.map((st) {
                return ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.corporateNavy,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  icon: const Icon(
                    Icons.check_circle_outline_rounded,
                    size: 16,
                    color: Colors.white,
                  ),
                  label: Text(
                    st['titleBn']!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  onPressed: _isTransitioning
                      ? null
                      : () => _handleTransition(st['key']!, st['titleBn']!),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _build13StageTimelineProgress(String currentStage) {
    const stages = CandidateRepository.official13Stages;
    final currentIndex = _findStageIndex(currentStage, stages);

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '১৩-ধাপ সরকারি প্রবাস টাইমলাইন স্ট্যাটাস',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: AppColors.deepNavy,
            ),
          ),
          const SizedBox(height: 12),
          ...List.generate(stages.length, (index) {
            final s = stages[index];
            final isCompleted = index < currentIndex;
            final isCurrent = index == currentIndex;
            final isLast = index == stages.length - 1;

            return _StageStatusRow(
              index: index + 1,
              titleBn: s['labelBn']!,
              titleEn: s['label']!,
              isCompleted: isCompleted,
              isCurrent: isCurrent,
              isLast: isLast,
            );
          }),
        ],
      ),
    );
  }

  Widget _buildSubCasesSummary(Map<String, dynamic> data) {
    final med = data['medicalCase'] as Map<String, dynamic>?;
    final visa = data['visaCase'] as Map<String, dynamic>?;
    final ticket = data['travelTicket'] as Map<String, dynamic>?;
    final clearance = data['clearanceCase'] as Map<String, dynamic>?;

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'উপ-মডিউল স্ট্যাটাস (Sub-Cases)',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: AppColors.deepNavy,
            ),
          ),
          const SizedBox(height: 10),
          _buildSubCaseItem(
            'মেডিকেল পরীক্ষা (GAMCA)',
            med?['status'] ?? 'অপেক্ষমাণ',
            med?['result'],
          ),
          _buildSubCaseItem(
            'দূতাবাস ভিসা স্ট্যাম্পিং',
            visa?['status'] ?? 'প্রক্রিয়াধীন',
            visa?['approvedDate'],
          ),
          _buildSubCaseItem(
            'বিএমইটি স্মার্ট কার্ড',
            clearance?['status'] ?? 'প্রক্রিয়াধীন',
            clearance?['smartCardNumber'],
          ),
          _buildSubCaseItem(
            'ফ্লাইটের টিকিট',
            ticket?['status'] ?? 'ইস্যু হয়নি',
            ticket?['flightNumber'],
          ),
        ],
      ),
    );
  }

  Widget _buildSubCaseItem(String title, String status, String? detail) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 12, color: AppColors.textPrimary),
          ),
          Row(
            children: [
              if (detail != null && detail.isNotEmpty) ...[
                Text(
                  '($detail)',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textDisabled,
                  ),
                ),
                const SizedBox(width: 6),
              ],
              Text(
                status,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.corporateNavy,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<Map<String, String>> _getLegalNextTransitions(String currentStage) {
    const stages = CandidateRepository.official13Stages;
    final idx = _findStageIndex(currentStage, stages);
    if (idx < 0 || idx >= stages.length - 1) return [];

    final nextIndex = idx + 1;
    final next = stages[nextIndex];
    return [
      {'key': next['key']!, 'titleBn': next['labelBn']!},
    ];
  }

  int _findStageIndex(String stage, List<Map<String, String>> stages) {
    final norm = stage.toUpperCase().trim();
    for (int i = 0; i < stages.length; i++) {
      if (stages[i]['key'] == norm) return i;
    }
    return 0;
  }

  String _maskPassport(String p) {
    if (p.length <= 4) return '***';
    return '${p.substring(0, 2)}***${p.substring(p.length - 2)}';
  }
}

class _StageStatusRow extends StatelessWidget {
  final int index;
  final String titleBn;
  final String titleEn;
  final bool isCompleted;
  final bool isCurrent;
  final bool isLast;

  const _StageStatusRow({
    required this.index,
    required this.titleBn,
    required this.titleEn,
    required this.isCompleted,
    required this.isCurrent,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Icon(
            isCompleted
                ? Icons.check_circle_rounded
                : isCurrent
                    ? Icons.play_circle_filled_rounded
                    : Icons.radio_button_unchecked_rounded,
            color: isCompleted
                ? AppColors.success
                : isCurrent
                    ? AppColors.corporatePink
                    : AppColors.textDisabled,
            size: 18,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '$index. $titleBn ($titleEn)',
              style: TextStyle(
                fontSize: 12,
                fontWeight: isCurrent ? FontWeight.w800 : FontWeight.w500,
                color: isCurrent
                    ? AppColors.deepNavy
                    : isCompleted
                        ? AppColors.textPrimary
                        : AppColors.textSecondary,
              ),
            ),
          ),
          if (isCurrent)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.corporatePink.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                'বর্তমান',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: AppColors.corporateNavy,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
