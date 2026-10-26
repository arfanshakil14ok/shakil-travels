import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/candidate/data/candidate_models.dart';
import 'package:shakil_travels/features/candidate/data/candidate_repository.dart';

class JobDetailsScreen extends StatefulWidget {
  final JobCircularModel job;
  final CandidateRepository repository;

  const JobDetailsScreen({
    super.key,
    required this.job,
    required this.repository,
  });

  @override
  State<JobDetailsScreen> createState() => _JobDetailsScreenState();
}

class _JobDetailsScreenState extends State<JobDetailsScreen> {
  bool _isApplying = false;

  Future<void> _handleApply() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('আবেদন নিশ্চিতকরণ (Confirm Application)'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'আপনি কি ${widget.job.title} পদের জন্য আবেদন জমা দিতে চান?',
              style: const TextStyle(fontSize: 14, height: 1.4),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.pageBackground,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'গন্তব্য দেশ: ${widget.job.countryName}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    'পদবী: ${widget.job.title}',
                    style: const TextStyle(fontSize: 12),
                  ),
                  if (widget.job.salaryMin != null)
                    Text(
                      'বেতন: ${widget.job.currency} ${widget.job.salaryMin!.toStringAsFixed(0)}',
                      style: const TextStyle(fontSize: 12),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'সতর্কতা: একজন প্রার্থী সর্বোচ্চ ৩টি সক্রিয় আবেদন করতে পারেন।',
              style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('বাতিল'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('হ্যাঁ, আবেদন জমা দিন'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isApplying = true);
    try {
      final res = await widget.repository.applyForJob(widget.job.id);
      if (!mounted) return;

      final appData = res['data'] as Map<String, dynamic>? ?? {};
      final appCode = appData['applicationCode']?.toString() ?? 'SGR-APP';

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          title: const Row(
            children: [
              Icon(
                Icons.check_circle_rounded,
                color: AppColors.success,
                size: 24,
              ),
              SizedBox(width: 8),
              Text('আবেদন সফল হয়েছে'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('আপনার আবেদন সফলভাবে গৃহীত হয়েছে।\nআবেদন কোড: $appCode'),
              const SizedBox(height: 8),
              const Text(
                'আমাদের কমপ্লায়েন্স টিম আপনার প্রোফাইল ও ডকুমেন্টস যাচাই করে পরবর্তী পদক্ষেপ গ্রহণ করবে।',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pop(context, true); // return success to jobs list
              },
              child: const Text('ঠিক আছে'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      final msg = e.toString().replaceFirst('ApiException: ', '');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg),
          backgroundColor: AppColors.error,
          duration: const Duration(seconds: 4),
        ),
      );
    } finally {
      if (mounted) setState(() => _isApplying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final j = widget.job;

    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(title: Text(j.title)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Header Card
              AppCard(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        StatusBadge.verified(j.status),
                        if (j.isFeatured)
                          const StatusBadge(
                            label: 'FEATURED',
                            backgroundColor: AppColors.goldLight,
                            textColor: AppColors.gold,
                            icon: Icons.star_rounded,
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      j.title,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.corporateNavy,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        if (j.countryFlag != null) ...[
                          Text(
                            j.countryFlag!,
                            style: const TextStyle(fontSize: 18),
                          ),
                          const SizedBox(width: 6),
                        ],
                        Text(
                          j.countryName,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (j.employerName != null) ...[
                          const Text(
                            ' • ',
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
                          Flexible(
                            child: Text(
                              j.employerName!,
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
                    const Divider(height: 24, color: AppColors.cardBorder),

                    // Salary Highlight
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'আনুমানিক মাসিক বেতন (Salary)',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              j.salaryMin != null
                                  ? '${j.currency} ${j.salaryMin!.toStringAsFixed(0)} ${j.salaryMax != null ? "- ${j.salaryMax!.toStringAsFixed(0)}" : ""}'
                                  : 'আলোচনা সাপেক্ষে (Negotiable)',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: AppColors.success,
                              ),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              'শূন্যপদ (Vacancies)',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${j.vacancies} জন',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: AppColors.deepNavy,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 2. Terms & Benefits Card
              AppCard(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'সুযোগ-সুবিধা ও চুক্তির শর্তাবলি (Benefits & Terms)',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 14),
                    _buildBenefitRow(
                      Icons.schedule_rounded,
                      'কাজের সময় (Duty Hours)',
                      j.dutyHours ?? '৮ ঘণ্টা / দিন (দৈনিক)',
                    ),
                    _buildBenefitRow(
                      Icons.description_outlined,
                      'চুক্তির মেয়াদ (Contract Period)',
                      j.contractPeriod ?? '২ বছর (নবায়নযোগ্য)',
                    ),
                    _buildBenefitRow(
                      Icons.restaurant_rounded,
                      'খাবার সুবিধা (Food)',
                      j.foodProvided
                          ? 'কোম্পানি বহন করবে (Provided)'
                          : 'নিজস্ব ব্যবস্থাপনায়',
                    ),
                    _buildBenefitRow(
                      Icons.home_work_outlined,
                      'থাকার ব্যবস্থা (Accommodation)',
                      j.accommodationProvided
                          ? 'কোম্পানি সরবরাহ করবে'
                          : 'প্রযোজ্য নয়',
                    ),
                    _buildBenefitRow(
                      Icons.local_hospital_outlined,
                      'চিকিৎসা ভাতা (Medical)',
                      j.medicalProvided ? 'কোম্পানি স্পন্সরড' : 'প্রযোজ্য নয়',
                    ),
                    _buildBenefitRow(
                      Icons.directions_bus_outlined,
                      'যাতায়াত সুবিধা (Transport)',
                      j.transportProvided ? 'কোম্পানি প্রদত্ত' : 'প্রযোজ্য নয়',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 3. Requirements Card
              AppCard(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'যোগ্যতা ও নথিপত্র (Eligibility & Requirements)',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 10),
                    if (j.experienceYearsRequired > 0)
                      Text(
                        '• ন্যূনতম অভিজ্ঞতা: ${j.experienceYearsRequired} বছর।',
                        style: const TextStyle(fontSize: 13, height: 1.4),
                      ),
                    if (j.skillsRequired != null &&
                        j.skillsRequired!.isNotEmpty)
                      Text(
                        '• প্রয়োজনীয় দক্ষতা: ${j.skillsRequired}',
                        style: const TextStyle(fontSize: 13, height: 1.4),
                      ),
                    const Text(
                      '• বৈধ পাসপোর্ট (ন্যূনতম ১ বছরের মেয়াদ থাকা আবশ্যক)।',
                      style: TextStyle(fontSize: 13, height: 1.4),
                    ),
                    const Text(
                      '• গামকা অনুমোদিত মেডিকেল ফিটনেস সনদ।',
                      style: TextStyle(fontSize: 13, height: 1.4),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // 4. Action Button
              AppButton(
                text: j.isOpen
                    ? 'এই পদের জন্য আবেদন করুন (Apply Now)'
                    : 'আবেদন গ্রহণ বন্ধ রয়েছে',
                icon: Icons.send_rounded,
                isLoading: _isApplying,
                onPressed: j.isOpen && !_isApplying ? _handleApply : null,
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBenefitRow(IconData icon, String title, String val) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.corporateNavy),
          const SizedBox(width: 10),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textPrimary,
                  height: 1.3,
                ),
                children: [
                  TextSpan(
                    text: '$title: ',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  TextSpan(
                    text: val,
                    style: const TextStyle(color: AppColors.textSecondary),
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
