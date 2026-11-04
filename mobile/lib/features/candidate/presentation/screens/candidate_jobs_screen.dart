import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/utils/support_launcher.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/candidate/data/candidate_models.dart';
import 'package:shakil_travels/features/candidate/data/candidate_repository.dart';
import 'job_details_screen.dart';

Widget _buildFlag(String? flagStr, {double size = 16}) {
  if (flagStr == null || flagStr.isEmpty) {
    return Text('🌐', style: TextStyle(fontSize: size));
  }
  if (flagStr.startsWith('http://') || flagStr.startsWith('https://')) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(3),
      child: Image.network(
        flagStr,
        width: size * 1.35,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Text('🌐', style: TextStyle(fontSize: size)),
      ),
    );
  }
  return Text(flagStr, style: TextStyle(fontSize: size));
}

class CandidateJobsScreen extends StatefulWidget {
  final CandidateRepository? repository;
  final String? initialSearch;
  final String? initialCountryId;

  const CandidateJobsScreen({
    super.key,
    this.repository,
    this.initialSearch,
    this.initialCountryId,
  });

  @override
  State<CandidateJobsScreen> createState() => _CandidateJobsScreenState();
}

class _CandidateJobsScreenState extends State<CandidateJobsScreen> {
  late final CandidateRepository _repository;
  final TextEditingController _searchController = TextEditingController();

  bool _isLoading = true;
  String? _errorMessage;

  List<JobCircularModel> _jobs = [];
  List<CountryFilterModel> _countries = [];
  String? _selectedCountryId;

  @override
  void initState() {
    super.initState();
    _repository =
        widget.repository ?? CandidateRepository(apiClient: ApiClient());
    if (widget.initialSearch != null && widget.initialSearch!.isNotEmpty) {
      _searchController.text = widget.initialSearch!;
    }
    _selectedCountryId = widget.initialCountryId;
    _loadInitialData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final countriesFuture = _repository.getCountries();
      final jobsFuture = _repository.getJobs(
        search: _searchController.text,
        countryId: _selectedCountryId,
      );

      final results = await Future.wait([countriesFuture, jobsFuture]);
      if (mounted) {
        setState(() {
          _countries = results[0] as List<CountryFilterModel>;
          _jobs = results[1] as List<JobCircularModel>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage =
              'চাকরির সার্কুলার লোড করা যায়নি। ইন্টারনেট সংযোগ চেক করুন।';
        });
      }
    }
  }

  Future<void> _filterJobs() async {
    setState(() => _isLoading = true);
    try {
      final jobs = await _repository.getJobs(
        search: _searchController.text,
        countryId: _selectedCountryId,
      );
      if (mounted) {
        setState(() {
          _jobs = jobs;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: const Text('Overseas Jobs / বৈদেশিক চাকরির সার্কুলার'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 1. Search Box
            Container(
              color: AppColors.surfaceWhite,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: TextField(
                controller: _searchController,
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _filterJobs(),
                decoration: InputDecoration(
                  hintText: 'পদবী বা ট্রেড অনুসন্ধান (e.g. ড্রাইভার, ওয়েল্ডার)',
                  prefixIcon: const Icon(
                    Icons.search_rounded,
                    color: AppColors.corporateNavy,
                  ),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, size: 20),
                          onPressed: () {
                            _searchController.clear();
                            _filterJobs();
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
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),

            // 2. Country Filter Chips
            if (_countries.isNotEmpty)
              Container(
                height: 48,
                color: AppColors.surfaceWhite,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4.0),
                      child: FilterChip(
                        label: const Text('সকল দেশ (All)'),
                        selected: _selectedCountryId == null,
                        selectedColor: AppColors.corporateNavy,
                        labelStyle: TextStyle(
                          fontSize: 12,
                          color: _selectedCountryId == null
                              ? AppColors.surfaceWhite
                              : AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                        onSelected: (selected) {
                          setState(() => _selectedCountryId = null);
                          _filterJobs();
                        },
                      ),
                    ),
                    ..._countries.map((c) {
                      final isSel = _selectedCountryId == c.id;
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4.0),
                        child: FilterChip(
                          avatar: c.flag != null ? _buildFlag(c.flag, size: 14) : null,
                          label: Text(c.name),
                          selected: isSel,
                          selectedColor: AppColors.corporateNavy,
                          labelStyle: TextStyle(
                            fontSize: 12,
                            color: isSel
                                ? AppColors.surfaceWhite
                                : AppColors.textPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                          onSelected: (selected) {
                            setState(
                              () => _selectedCountryId = selected ? c.id : null,
                            );
                            _filterJobs();
                          },
                        ),
                      );
                    }),
                  ],
                ),
              ),

            const Divider(height: 1, color: AppColors.cardBorder),

            // Offline Indicator Banner
            if (_repository.isOfflineDataUsed)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                color: const Color(0xFFFFFBEB),
                child: const Row(
                  children: [
                    Icon(Icons.cloud_off_rounded, size: 15, color: Color(0xFFD97706)),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'অফলাইন মোড: পূর্বে সংরক্ষিত সার্কুলার প্রদর্শিত হচ্ছে',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF92400E),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // 3. Jobs List
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: LoadingIndicator(
                        message: 'সার্কুলার লোড হচ্ছে...',
                      ),
                    )
                  : _errorMessage != null
                      ? ErrorView(
                          message: _errorMessage!,
                          onRetry: _loadInitialData,
                        )
                      : _jobs.isEmpty
                          ? _buildEmptyState()
                          : RefreshIndicator(
                              color: AppColors.corporateNavy,
                              onRefresh: _filterJobs,
                              child: ListView.builder(
                                padding: const EdgeInsets.all(16),
                                itemCount: _jobs.length,
                                itemBuilder: (ctx, index) {
                                  final job = _jobs[index];
                                  return _JobCard(
                                    job: job,
                                    onTap: () async {
                                      final applied =
                                          await Navigator.push<bool>(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => JobDetailsScreen(
                                            job: job,
                                            repository: _repository,
                                          ),
                                        ),
                                      );
                                      if (applied == true) {
                                        _filterJobs();
                                      }
                                    },
                                  );
                                },
                              ),
                            ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.search_off_rounded,
              size: 54,
              color: AppColors.textMuted,
            ),
            const SizedBox(height: 14),
            const Text(
              'কোনো সার্কুলার পাওয়া যায়নি',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            const Text(
              'আপনার ফিল্টারের সাথে মিলে এমন কোনো উন্মুক্ত সার্কুলার বর্তমানে নেই। অন্য দেশ বা ট্রেড দিয়ে চেষ্টা করুন।',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                _searchController.clear();
                setState(() => _selectedCountryId = null);
                _filterJobs();
              },
              child: const Text('সব সার্কুলার দেখুন'),
            ),
          ],
        ),
      ),
    );
  }
}

class _JobCard extends StatelessWidget {
  final JobCircularModel job;
  final VoidCallback onTap;

  const _JobCard({required this.job, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: AppCard(
        onTap: onTap,
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      if (job.countryFlag != null) ...[
                        _buildFlag(job.countryFlag, size: 14),
                        const SizedBox(width: 6),
                      ],
                      Expanded(
                        child: Text(
                          job.countryName,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.corporateNavy,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                StatusBadge.verified(job.categoryName),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              job.title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            if (job.employerName != null) ...[
              const SizedBox(height: 2),
              Text(
                job.employerName!,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
            const Divider(height: 18, color: AppColors.cardBorder),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    job.salaryMin != null
                        ? '${job.currency} ${job.salaryMin!.toStringAsFixed(0)}'
                        : 'আলোচনা সাপেক্ষে',
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: AppColors.success,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // WhatsApp Quick Consultation
                    IconButton(
                      icon: const Icon(Icons.chat_bubble_outline_rounded,
                          size: 18, color: AppColors.success),
                      tooltip: 'WhatsApp-এ পরামর্শ',
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () {
                        SupportLauncher.openWhatsApp(
                          context: context,
                          message:
                              'আসসালামু আলাইকুম, আমি শাকিল ট্রাভেলস অ্যাপ থেকে ${job.title} (কোড: ${job.jobCode}, দেশ: ${job.countryName}) সার্কুলার সম্পর্কে জানতে চাই।',
                        );
                      },
                    ),
                    const SizedBox(width: 8),

                    // Quick Share
                    IconButton(
                      icon: const Icon(Icons.share_outlined,
                          size: 18, color: AppColors.corporateNavy),
                      tooltip: 'শেয়ার করুন',
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () {
                        SupportLauncher.shareJob(
                          context: context,
                          title: job.title,
                          countryName: job.countryName,
                          jobCode: job.jobCode,
                          salary: job.salaryMin != null
                              ? '${job.currency} ${job.salaryMin!.toStringAsFixed(0)}'
                              : null,
                          employer: job.employerName,
                        );
                      },
                    ),
                    const SizedBox(width: 10),

                    const Row(
                      children: [
                        Text(
                          'বিস্তারিত',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            color: AppColors.corporateNavy,
                          ),
                        ),
                        SizedBox(width: 2),
                        Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 11,
                          color: AppColors.corporateNavy,
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
