import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/candidate/data/candidate_models.dart';
import 'package:shakil_travels/features/candidate/data/candidate_repository.dart';
import 'application_details_screen.dart';

class CandidateApplicationsScreen extends StatefulWidget {
  final CandidateRepository? repository;
  final void Function(int)? onNavigateTab;

  const CandidateApplicationsScreen({
    super.key,
    this.repository,
    this.onNavigateTab,
  });

  @override
  State<CandidateApplicationsScreen> createState() =>
      _CandidateApplicationsScreenState();
}

class _CandidateApplicationsScreenState
    extends State<CandidateApplicationsScreen> {
  late final CandidateRepository _repository;
  bool _isLoading = true;
  String? _errorMessage;

  List<CandidateApplicationModel> _applications = [];
  String _activeFilter = 'ALL'; // ALL, ACTIVE, COMPLETED

  @override
  void initState() {
    super.initState();
    _repository =
        widget.repository ?? CandidateRepository(apiClient: ApiClient());
    _loadApplications();
  }

  Future<void> _loadApplications() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final list = await _repository.getMyApplications();
      if (mounted) {
        setState(() {
          _applications = list;
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

  List<CandidateApplicationModel> get _filteredApplications {
    if (_activeFilter == 'ACTIVE') {
      return _applications.where((a) {
        final st = a.status.toUpperCase();
        return st != 'REJECTED' &&
            st != 'CANCELLED' &&
            st != 'COMPLETED' &&
            st != 'DEPARTED';
      }).toList();
    } else if (_activeFilter == 'COMPLETED') {
      return _applications.where((a) {
        final st = a.status.toUpperCase();
        return st == 'COMPLETED' || st == 'DEPARTED';
      }).toList();
    }
    return _applications;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: const Text('আমার আবেদনসমূহ (My Applications)'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _isLoading ? null : _loadApplications,
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
        child: LoadingIndicator(message: 'আবেদনের তালিকা লোড হচ্ছে...'),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ErrorView(message: _errorMessage!, onRetry: _loadApplications),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadApplications,
      color: AppColors.corporateNavy,
      child: Column(
        children: [
          _buildFilterTabs(),
          Expanded(
            child: _filteredApplications.isEmpty
                ? _buildEmptyState()
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _filteredApplications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final app = _filteredApplications[index];
                      return _buildApplicationCard(app);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTabs() {
    return Container(
      color: AppColors.surfaceWhite,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          _buildFilterChip('সবগুলো (${_applications.length})', 'ALL'),
          const SizedBox(width: 8),
          _buildFilterChip('চলমান', 'ACTIVE'),
          const SizedBox(width: 8),
          _buildFilterChip('সম্পন্ন', 'COMPLETED'),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String filterKey) {
    final isSelected = _activeFilter == filterKey;
    return GestureDetector(
      onTap: () {
        setState(() {
          _activeFilter = filterKey;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color:
              isSelected ? AppColors.corporateNavy : AppColors.pageBackground,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.corporateNavy : AppColors.cardBorder,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color:
                isSelected ? AppColors.surfaceWhite : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildApplicationCard(CandidateApplicationModel app) {
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
                  'কোড: ${app.applicationCode}',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.corporateNavy,
                  ),
                ),
              ),
              StatusBadge.processing(app.effectiveStage),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            app.jobTitle ?? 'Overseas Position',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.deepNavy,
            ),
          ),
          const SizedBox(height: 6),
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
          const SizedBox(height: 8),
          if (app.createdAt.isNotEmpty)
            Text(
              'আবেদনের তারিখ: ${app.createdAt.split('T').first}',
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textDisabled,
              ),
            ),
          const SizedBox(height: 12),
          AppButton(
            text: 'বিস্তারিত ও ট্র্যাকার দেখুন',
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

  Widget _buildEmptyState() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const SizedBox(height: 40),
        Center(
          child: Column(
            children: [
              const Icon(
                Icons.assignment_late_outlined,
                size: 56,
                color: AppColors.corporatePink,
              ),
              const SizedBox(height: 14),
              const Text(
                'কোনো আবেদন পাওয়া যায়নি',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.deepNavy,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'আপনি এখনও কোনো চাকরির বিজ্ঞপ্তিতে আবেদন করেননি। শাকিল ট্রাভেলস এর সার্কুলার তালিকা থেকে আপনার পছন্দের পেশা বেছে নিয়ে আবেদন করুন।',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 20),
              AppButton(
                text: 'চাকরির সার্কুলার দেখুন',
                icon: Icons.travel_explore_rounded,
                onPressed: () {
                  widget.onNavigateTab?.call(1);
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}
