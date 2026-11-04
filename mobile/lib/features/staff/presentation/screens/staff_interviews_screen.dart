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

class StaffInterviewsScreen extends StatefulWidget {
  final StaffRepository? repository;

  const StaffInterviewsScreen({super.key, this.repository});

  @override
  State<StaffInterviewsScreen> createState() => _StaffInterviewsScreenState();
}

class _StaffInterviewsScreenState extends State<StaffInterviewsScreen> {
  late final StaffRepository _repository;
  bool _isLoading = true;
  String? _errorMessage;

  List<StaffInterviewModel> _interviews = [];

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? StaffRepository(apiClient: ApiClient());
    _loadInterviews();
  }

  Future<void> _loadInterviews() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final list = await _repository.getInterviews();
      if (mounted) {
        setState(() {
          _interviews = list;
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
        title: const Text('ইন্টারভিউ ও সিলেকশন শিডিউল'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _isLoading ? null : _loadInterviews,
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
        child: LoadingIndicator(message: 'ইন্টারভিউ শিডিউল লোড হচ্ছে...'),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ErrorView(message: _errorMessage!, onRetry: _loadInterviews),
        ),
      );
    }

    if (_interviews.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.event_busy_rounded,
                size: 48,
                color: AppColors.corporatePink,
              ),
              SizedBox(height: 12),
              Text(
                'কোনো নির্ধারিত ইন্টারভিউ শিডিউল নেই',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.deepNavy,
                ),
              ),
              SizedBox(height: 6),
              Text(
                'নতুন কোনো নিয়োগ বিজ্ঞপ্তি বা ইন্টারভিউ নির্ধারণ হলে এখানে প্রদর্শিত হবে।',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadInterviews,
      color: AppColors.corporateNavy,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _interviews.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final i = _interviews[index];
          return _buildInterviewCard(i);
        },
      ),
    );
  }

  Widget _buildInterviewCard(StaffInterviewModel i) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.calendar_month_rounded,
                    color: AppColors.corporateNavy,
                    size: 18,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    i.scheduledAt.split('T').first,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: AppColors.deepNavy,
                    ),
                  ),
                ],
              ),
              StatusBadge.processing(i.status),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            i.applicantName ?? 'প্রার্থী',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.deepNavy,
            ),
          ),
          if (i.applicantNumber != null)
            Text(
              'আইডি: ${i.applicantNumber}',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.corporatePink,
              ),
            ),
          const SizedBox(height: 8),
          const Divider(height: 1, color: AppColors.cardBorder),
          const SizedBox(height: 8),
          if (i.jobTitle != null)
            Row(
              children: [
                const Icon(
                  Icons.work_outline_rounded,
                  size: 14,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    i.jobTitle!,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(
                Icons.location_on_outlined,
                size: 14,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  i.location ?? 'শাকিল ট্রাভেলস প্রধান কার্যালয়, ঢাকা',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
