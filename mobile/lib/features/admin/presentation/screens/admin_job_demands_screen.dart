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

class AdminJobDemandsScreen extends StatefulWidget {
  final StaffRepository? repository;

  const AdminJobDemandsScreen({super.key, this.repository});

  @override
  State<AdminJobDemandsScreen> createState() => _AdminJobDemandsScreenState();
}

class _AdminJobDemandsScreenState extends State<AdminJobDemandsScreen> {
  late final StaffRepository _repository;
  final _searchController = TextEditingController();

  bool _isLoading = true;
  String? _errorMessage;

  List<StaffJobDemandModel> _jobs = [];
  String _activeStatus = 'ALL';

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? StaffRepository(apiClient: ApiClient());
    _loadJobDemands();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadJobDemands() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final list = await _repository.getJobDemands(
        search: _searchController.text.trim(),
        status: _activeStatus,
      );

      if (mounted) {
        setState(() {
          _jobs = list;
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
        title: Text('আন্তর্জাতিক চাকরির চাহিদা (${_jobs.length})'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _isLoading ? null : _loadJobDemands,
            tooltip: 'রিফ্রেশ করুন',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildStatusFilterChips(),
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
          hintText: 'চাকরির পদবী বা কোড দিয়ে খুঁজুন...',
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
                    _loadJobDemands();
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
        onSubmitted: (_) => _loadJobDemands(),
      ),
    );
  }

  Widget _buildStatusFilterChips() {
    return Container(
      color: AppColors.surfaceWhite,
      height: 48,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        children: [
          _buildFilterChip('সবগুলো', 'ALL'),
          const SizedBox(width: 8),
          _buildFilterChip('প্রকাশিত (PUBLISHED)', 'PUBLISHED'),
          const SizedBox(width: 8),
          _buildFilterChip('ড্রাফট (DRAFT)', 'DRAFT'),
          const SizedBox(width: 8),
          _buildFilterChip('বন্ধ (CLOSED)', 'CLOSED'),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String statusKey) {
    final isSelected = _activeStatus == statusKey;
    return GestureDetector(
      onTap: () {
        setState(() => _activeStatus = statusKey);
        _loadJobDemands();
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
        child: LoadingIndicator(message: 'জব ডিমান্ড লোড হচ্ছে...'),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ErrorView(message: _errorMessage!, onRetry: _loadJobDemands),
        ),
      );
    }

    if (_jobs.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.work_off_rounded,
                size: 48,
                color: AppColors.corporatePink,
              ),
              SizedBox(height: 12),
              Text(
                'কোনো জব ডিমান্ড পাওয়া যায়নি',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.deepNavy,
                ),
              ),
              SizedBox(height: 6),
              Text(
                'সার্চ ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadJobDemands,
      color: AppColors.corporateNavy,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _jobs.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final j = _jobs[index];
          return _buildJobDemandCard(j);
        },
      ),
    );
  }

  Widget _buildJobDemandCard(StaffJobDemandModel j) {
    return AppCard(
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
                  j.jobCode,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.corporateNavy,
                  ),
                ),
              ),
              StatusBadge.processing(j.status),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            j.title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppColors.deepNavy,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              if (j.countryFlag != null) Text('${j.countryFlag} '),
              Text(
                j.countryName,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
              if (j.employerName != null) ...[
                const Text(
                  ' • ',
                  style: TextStyle(color: AppColors.textDisabled),
                ),
                Flexible(
                  child: Text(
                    j.employerName!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          const Divider(height: 1, color: AppColors.cardBorder),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'শূন্যপদ: ${j.vacancies} জন',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.corporateNavy,
                ),
              ),
              if (j.salaryMin != null)
                Text(
                  'বেতন: ${j.salaryMin} ${j.currency}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.success,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
