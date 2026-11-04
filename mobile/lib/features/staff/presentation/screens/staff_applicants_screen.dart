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
import 'staff_applicant_details_screen.dart';

class StaffApplicantsScreen extends StatefulWidget {
  final StaffRepository? repository;

  const StaffApplicantsScreen({super.key, this.repository});

  @override
  State<StaffApplicantsScreen> createState() => _StaffApplicantsScreenState();
}

class _StaffApplicantsScreenState extends State<StaffApplicantsScreen> {
  late final StaffRepository _repository;
  final _searchController = TextEditingController();

  bool _isLoading = true;
  String? _errorMessage;

  List<StaffApplicantModel> _applicants = [];
  String _activeStatus = 'ALL';
  int _totalCount = 0;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? StaffRepository(apiClient: ApiClient());
    _loadApplicants();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadApplicants() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _repository.getApplicants(
        search: _searchController.text.trim(),
        status: _activeStatus,
      );

      if (mounted) {
        setState(() {
          _applicants = res['applicants'] as List<StaffApplicantModel>;
          _totalCount = res['total'] as int? ?? _applicants.length;
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
        title: Text('প্রার্থী ব্যবস্থাপনা ($_totalCount)'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _isLoading ? null : _loadApplicants,
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
          hintText: 'প্রার্থীর নাম, আইডি, পাসপোর্ট বা মোবাইল দিয়ে খুঁজুন...',
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
                    _loadApplicants();
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
        onSubmitted: (_) => _loadApplicants(),
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
          _buildFilterChip('নতুন (NEW)', 'NEW'),
          const SizedBox(width: 8),
          _buildFilterChip('সক্রিয় (ACTIVE)', 'ACTIVE'),
          const SizedBox(width: 8),
          _buildFilterChip('প্রক্রিয়াধীন (IN_PROCESS)', 'IN_PROCESS'),
          const SizedBox(width: 8),
          _buildFilterChip('যোগদান সম্পন্ন (PLACED)', 'PLACED'),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String statusKey) {
    final isSelected = _activeStatus == statusKey;
    return GestureDetector(
      onTap: () {
        setState(() => _activeStatus = statusKey);
        _loadApplicants();
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
        child: LoadingIndicator(message: 'প্রার্থী তালিকা লোড হচ্ছে...'),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ErrorView(message: _errorMessage!, onRetry: _loadApplicants),
        ),
      );
    }

    if (_applicants.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.person_search_rounded,
                size: 48,
                color: AppColors.corporatePink,
              ),
              SizedBox(height: 12),
              Text(
                'কোনো প্রার্থী পাওয়া যায়নি',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.deepNavy,
                ),
              ),
              SizedBox(height: 6),
              Text(
                'অন্য কোনো নাম বা ফিল্টার দিয়ে চেষ্টা করুন।',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadApplicants,
      color: AppColors.corporateNavy,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _applicants.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final a = _applicants[index];
          return _buildApplicantCard(a);
        },
      ),
    );
  }

  Widget _buildApplicantCard(StaffApplicantModel a) {
    return AppCard(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => StaffApplicantDetailsScreen(
              applicantId: a.id,
              applicantNumber: a.applicantNumber,
              repository: _repository,
            ),
          ),
        ).then((_) => _loadApplicants());
      },
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                a.fullName,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppColors.deepNavy,
                ),
              ),
              StatusBadge.verified(a.status),
            ],
          ),
          const SizedBox(height: 3),
          Row(
            children: [
              Text(
                'আইডি: ${a.applicantNumber}',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.corporatePink,
                ),
              ),
              if (a.passportNumber != null) ...[
                const Text(
                  ' • ',
                  style: TextStyle(color: AppColors.textDisabled),
                ),
                Text(
                  'পাসপোর্ট: ${a.maskedPassport}',
                  style: const TextStyle(
                    fontSize: 11,
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'ট্রেড: ${a.profession ?? 'সাধারণ শ্রমিক'}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                'মোবাইল: ${a.maskedPhone}',
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (a.countryName != null)
                Row(
                  children: [
                    if (a.countryFlag != null) Text('${a.countryFlag} '),
                    Text(
                      a.countryName!,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                )
              else
                const SizedBox(),
              Row(
                children: [
                  const Icon(
                    Icons.file_present_rounded,
                    size: 14,
                    color: AppColors.textDisabled,
                  ),
                  const SizedBox(width: 2),
                  Text(
                    '${a.documentsCount}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textDisabled,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.note_alt_rounded,
                    size: 14,
                    color: AppColors.textDisabled,
                  ),
                  const SizedBox(width: 2),
                  Text(
                    '${a.notesCount}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textDisabled,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
