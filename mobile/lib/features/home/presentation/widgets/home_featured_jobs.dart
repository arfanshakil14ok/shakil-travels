import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../candidate/data/candidate_models.dart';
import '../../../candidate/data/candidate_repository.dart';
import '../../../candidate/presentation/screens/job_details_screen.dart';

class HomeFeaturedJobs extends StatelessWidget {
  final List<JobCircularModel> jobs;
  final VoidCallback? onViewAllTap;

  const HomeFeaturedJobs({
    super.key,
    required this.jobs,
    this.onViewAllTap,
  });

  static List<JobCircularModel> get fallbackFeaturedJobs => const [
        JobCircularModel(
          id: 'job_sa_1',
          jobCode: 'JOB-SA-01',
          title: 'হেভি ভেহিকেল ড্রাইভার (Heavy Driver)',
          employerName: 'Al-Khodari Logistics & Contracting',
          countryName: 'সৌদি আরব (Saudi Arabia)',
          countryFlag: '🇸🇦',
          categoryName: 'পরিবহন ও ড্রাইভিং',
          salaryMin: 1800,
          salaryMax: 2500,
          currency: 'SAR',
          vacancies: 25,
          deadline: '2026-11-15',
          status: 'PUBLISHED',
          isFeatured: true,
          skillsRequired: 'বৈধ ড্রাইভিং লাইসেন্স, কমপক্ষে ২ বছরের অভিজ্ঞতা',
        ),
        JobCircularModel(
          id: 'job_uae_2',
          jobCode: 'JOB-AE-02',
          title: 'হোটেল সার্ভিস ও ক্যাটারিং ক্রু',
          employerName: 'Emaar Hospitality Group',
          countryName: 'সংযুক্ত আরব আমিরাত (UAE)',
          countryFlag: '🇦🇪',
          categoryName: 'হসপিটালিটি ও পর্যটন',
          salaryMin: 2200,
          salaryMax: 3000,
          currency: 'AED',
          vacancies: 15,
          deadline: '2026-11-10',
          status: 'PUBLISHED',
          isFeatured: true,
          skillsRequired: 'প্রাথমিক ইংরেজি জ্ঞান, সুদর্শন ও স্বাস্থ্যবান',
        ),
        JobCircularModel(
          id: 'job_qa_3',
          jobCode: 'JOB-QA-03',
          title: 'সিকিউরিটি গার্ড ও সুপারভাইজার',
          employerName: 'Gulf Security Services',
          countryName: 'কাতার (Qatar)',
          countryFlag: '🇶🇦',
          categoryName: 'নিরাপত্তা ও প্রশাসন',
          salaryMin: 1600,
          salaryMax: 2200,
          currency: 'QAR',
          vacancies: 30,
          deadline: '2026-11-20',
          status: 'PUBLISHED',
          isFeatured: true,
          skillsRequired: 'ন্যূনতম উচ্চতা ৫ ফুট ৭ ইঞ্চি, সুঠাম দেহ ও ফিটনেস',
        ),
        JobCircularModel(
          id: 'job_my_4',
          jobCode: 'JOB-MY-04',
          title: 'ইলেকট্রনিক্স ফ্যাক্টরি অপারেটর',
          employerName: 'Inari Amertron Berhad',
          countryName: 'মালয়েশিয়া (Malaysia)',
          countryFlag: '🇲🇾',
          categoryName: 'উৎপাদন ও ফ্যাক্টরি',
          salaryMin: 1800,
          salaryMax: 2400,
          currency: 'MYR',
          vacancies: 50,
          deadline: '2026-11-25',
          status: 'PUBLISHED',
          isFeatured: true,
          skillsRequired: 'বয়স ১৮-৩০ বছর, ওভারটাইম সুবিধা',
        ),
      ];

  @override
  Widget build(BuildContext context) {
    final displayJobs = jobs.isNotEmpty ? jobs.take(4).toList() : fallbackFeaturedJobs;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Title
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppColors.corporatePink.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.auto_awesome_rounded,
                      color: AppColors.corporateNavy,
                      size: 16,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'চলমান বৈদেশিক নিয়োগ',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          'সরকারি নীতিমালায় অনুমোদিত ডিমান্ড',
                          style: TextStyle(
                            fontSize: 10.5,
                            color: AppColors.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 6),
            TextButton.icon(
              onPressed: onViewAllTap,
              icon: const Text(
                'সবগুলো',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.corporateNavy,
                ),
              ),
              label: const Icon(
                Icons.arrow_forward_rounded,
                size: 14,
                color: AppColors.corporateNavy,
              ),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // List of Clean Job Cards
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: displayJobs.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final job = displayJobs[index];
            return _JobCardItem(job: job);
          },
        ),
      ],
    );
  }
}

class _JobCardItem extends StatelessWidget {
  final JobCircularModel job;

  const _JobCardItem({required this.job});

  @override
  Widget build(BuildContext context) {
    String salaryText = 'আলোচনা সাপেক্ষে';
    if (job.salaryMin != null && job.salaryMax != null) {
      salaryText = '${job.salaryMin!.toInt()} - ${job.salaryMax!.toInt()} ${job.currency}';
    } else if (job.salaryMin != null) {
      salaryText = '${job.salaryMin!.toInt()} ${job.currency}';
    }

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Flag + Country + Vacancy Pill
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Text(
                      job.countryFlag ?? '🌐',
                      style: const TextStyle(fontSize: 18),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        job.countryName,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.successLight,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${job.vacancies} জন নিয়োগ',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.success,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Job Title
          Text(
            job.title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: AppColors.corporateNavy,
            ),
          ),
          if (job.employerName != null && job.employerName!.isNotEmpty) ...[
            const SizedBox(height: 3),
            Text(
              job.employerName!,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textMuted,
              ),
            ),
          ],
          const SizedBox(height: 12),

          // Footer: Salary & Apply Button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'মাসিক আনুমানিক বেতন',
                    style: TextStyle(
                      fontSize: 10,
                      color: AppColors.textMuted,
                    ),
                  ),
                  Text(
                    salaryText,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: AppColors.success,
                    ),
                  ),
                ],
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.corporateNavy,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => JobDetailsScreen(
                        job: job,
                        repository: CandidateRepository(apiClient: ApiClient()),
                      ),
                    ),
                  );
                },
                child: const Text(
                  'আবেদন করুন',
                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
