import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/staff/data/staff_models.dart';
import 'package:shakil_travels/features/staff/data/staff_repository.dart';
import 'staff_case_details_screen.dart';

class StaffProcessingCasesScreen extends StatefulWidget {
  final StaffRepository? repository;

  const StaffProcessingCasesScreen({super.key, this.repository});

  @override
  State<StaffProcessingCasesScreen> createState() =>
      _StaffProcessingCasesScreenState();
}

class _StaffProcessingCasesScreenState
    extends State<StaffProcessingCasesScreen> {
  late final StaffRepository _repository;
  final _searchController = TextEditingController();

  bool _isLoading = true;
  String? _errorMessage;

  List<StaffProcessingCaseModel> _cases = [];
  String _activeQueue = 'ALL';
  int _totalCount = 0;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? StaffRepository(apiClient: ApiClient());
    _loadCases();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadCases() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _repository.getProcessingCases(
        search: _searchController.text.trim(),
        queue: _activeQueue,
      );

      if (mounted) {
        setState(() {
          _cases = result['cases'] as List<StaffProcessingCaseModel>;
          _totalCount = result['total'] as int? ?? _cases.length;
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
        title: Text('ফাইল প্রসেসিং কিউ ($_totalCount)'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _isLoading ? null : _loadCases,
            tooltip: 'রিফ্রেশ করুন',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildQueueFilterChips(),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      color: AppColors.surfaceWhite,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'কেস কোড, প্রার্থীর নাম, পাসপোর্ট বা মোবাইল...',
          hintStyle: const TextStyle(
            fontSize: 12,
            color: AppColors.textDisabled,
          ),
          prefixIcon: const Icon(
            Icons.search_rounded,
            size: 20,
            color: AppColors.corporateNavy,
          ),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    _loadCases();
                  },
                )
              : null,
          filled: true,
          fillColor: AppColors.pageBackground,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 10,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppColors.cardBorder),
          ),
        ),
        onSubmitted: (_) => _loadCases(),
      ),
    );
  }

  Widget _buildQueueFilterChips() {
    return Container(
      color: AppColors.surfaceWhite,
      height: 48,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        children: [
          _buildFilterChip('সবগুলো', 'ALL'),
          const SizedBox(width: 8),
          _buildFilterChip('ডকুমেন্ট কিউ', 'document_officer'),
          const SizedBox(width: 8),
          _buildFilterChip('মেডিকেল কিউ', 'medical'),
          const SizedBox(width: 8),
          _buildFilterChip('ভিসা কিউ', 'visa'),
          const SizedBox(width: 8),
          _buildFilterChip('ক্লিয়ারেন্স কিউ', 'clearance'),
          const SizedBox(width: 8),
          _buildFilterChip('ফ্লাইট কিউ', 'travel'),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String queueKey) {
    final isSelected = _activeQueue == queueKey;
    return GestureDetector(
      onTap: () {
        setState(() => _activeQueue = queueKey);
        _loadCases();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color:
              isSelected ? AppColors.corporateNavy : AppColors.pageBackground,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.corporateNavy : AppColors.cardBorder,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color:
                  isSelected ? AppColors.surfaceWhite : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: LoadingIndicator(message: 'প্রসেসিং কেস তালিকা লোড হচ্ছে...'),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ErrorView(message: _errorMessage!, onRetry: _loadCases),
        ),
      );
    }

    if (_cases.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.folder_open_rounded,
                size: 48,
                color: AppColors.corporatePink,
              ),
              SizedBox(height: 12),
              Text(
                'কোনো রিক্রুটমেন্ট কেস পাওয়া যায়নি',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.deepNavy,
                ),
              ),
              SizedBox(height: 6),
              Text(
                'সার্চ কিউয়ারি বা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadCases,
      color: AppColors.corporateNavy,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _cases.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final c = _cases[index];
          return _buildCaseCard(c);
        },
      ),
    );
  }

  Widget _buildCaseCard(StaffProcessingCaseModel c) {
    final candidateName = c.applicant?.fullName ?? 'Applicant';
    final applicantNo = c.applicant?.applicantNumber ?? '';
    final countryFlag = c.countryFlag ?? '✈️';
    final countryName = c.countryName ?? 'Overseas';
    final jobTitle = c.jobTitle ?? 'Overseas Position';

    return AppCard(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => StaffCaseDetailsScreen(
              caseId: c.id,
              processingCode: c.processingCode,
              repository: _repository,
            ),
          ),
        ).then((_) => _loadCases());
      },
      padding: const EdgeInsets.all(14),
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
                  'কেস: ${c.processingCode}',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.corporateNavy,
                  ),
                ),
              ),
              StatusBadge.processing(c.currentStage),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            candidateName,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: AppColors.deepNavy,
            ),
          ),
          const SizedBox(height: 2),
          Row(
            children: [
              Text(
                'আইডি: $applicantNo',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              if (c.applicant?.passportNumber != null) ...[
                const Text(
                  ' • ',
                  style: TextStyle(color: AppColors.textDisabled),
                ),
                Text(
                  'পাসপোর্ট: ${c.applicant!.maskedPassport}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          const Divider(height: 1, color: AppColors.cardBorder),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(countryFlag, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  '$jobTitle ($countryName)',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textDisabled,
                size: 20,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
