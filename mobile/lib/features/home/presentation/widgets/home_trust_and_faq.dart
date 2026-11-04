import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

class HomeTrustAndFaq extends StatelessWidget {
  const HomeTrustAndFaq({super.key});

  static const List<Map<String, dynamic>> _trustPillars = [
    {
      'icon': Icons.verified_rounded,
      'title': 'অনুমোদিত RL-2579',
      'desc': 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত রিক্রুটিং এজেন্সি',
    },
    {
      'icon': Icons.shield_outlined,
      'title': '১০০% বৈধ অভিবাসন',
      'desc': 'বিএমইটি স্মার্ট কার্ড ও মন্ত্রণালয়ের ছাড়পত্র প্রাপ্ত',
    },
    {
      'icon': Icons.money_off_csred_rounded,
      'title': 'নো হিডেন ফি',
      'desc': 'কোনো প্রকার গোপন বা অপ্রত্যাশিত মধ্যস্বত্বভোগী খরচ নেই',
    },
    {
      'icon': Icons.workspace_premium_rounded,
      'title': '৭ বছরের অভিজ্ঞতা',
      'desc': 'হাজারো কর্মীর সফল প্রবাস যাত্রার বিশ্বস্ত সহযোগী',
    },
  ];

  static const List<Map<String, String>> _faqs = [
    {
      'q': 'আবেদনের জন্য কী কী কাগজপত্র প্রয়োজন?',
      'a':
          'কমপক্ষে ৬ মাসের মেয়াদযুক্ত মূল পাসপোর্ট, পাসপোর্ট সাইজের ল্যাব প্রিন্ট ছবি, জাতীয় পরিচয়পত্র (NID) এবং কাজের অভিজ্ঞতা বা স্কিল সার্টিফিকেট (যদি থাকে)।',
    },
    {
      'q': 'ভিসা প্রসেসিং সম্পন্ন হতে কতদিন সময় লাগে?',
      'a':
          'দেশ ও পেশাভেদে সাধারণ ভিসা প্রসেসিং সম্পন্ন হতে ৩০ থেকে ৬০ কার্যদিবস সময় লাগে। পুরো প্রক্রিয়ার লাইভ অগ্রগতি আমাদের অ্যাপের ট্র্যাকিং সেকশনে দেখা যায়।',
    },
    {
      'q': 'কীভাবে পাসপোর্ট ও ফাইলের অগ্রগতি ট্র্যাক করব?',
      'a':
          'অ্যাপের নিচের "ট্র্যাকিং" ট্যাবে গিয়ে আপনার পাসপোর্ট নম্বর লিখুন। আপনার ফাইলটি বর্তমানে কোন ধাপে আছে (যেমন: মেডিকেল, ভিসা বা বিএমইটি) তা সরাসরি দেখতে পারবেন।',
    },
    {
      'q': 'সরাসরি অফিসে যোগাযোগের ঠিকানা ও সময় কী?',
      'a':
          'ইসলামপুর মোড়, ডায়াবেটিস হাসপাতালের সামনে, নেত্রকোনা।\nঅফিসের সময়: শনিবার - বৃহস্পতিবার, সকাল ৯:০০ - সন্ধ্যা ৬:০০ (শুক্রবার সাপ্তাহিক ছুটি)।',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. Trust & Regulatory Standards Header
        const Row(
          children: [
            Icon(Icons.security_rounded, color: AppColors.corporateNavy, size: 18),
            SizedBox(width: 8),
            Text(
              'কেন শাকিল ট্রাভেলস বেছে নেবেন?',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        const Text(
          'আপনার স্বপ্ন পূরণে আমাদের সততা, স্বচ্ছতা ও শতভাগ দায়িত্বশীলতা',
          style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 12),

        // 4 Pillars Grid
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.45,
          ),
          itemCount: _trustPillars.length,
          itemBuilder: (context, index) {
            final p = _trustPillars[index];
            return Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(p['icon'] as IconData, color: AppColors.success, size: 20),
                  const SizedBox(height: 6),
                  Text(
                    p['title'] as String,
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: AppColors.corporateNavy,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    p['desc'] as String,
                    style: const TextStyle(
                      fontSize: 9.5,
                      color: AppColors.textSecondary,
                      height: 1.25,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            );
          },
        ),
        const SizedBox(height: 24),

        // 2. FAQ Section
        const Row(
          children: [
            Icon(Icons.help_outline_rounded, color: AppColors.corporateNavy, size: 18),
            SizedBox(width: 8),
            Text(
              'সাধারণ জিজ্ঞাসা (FAQ)',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        const Text(
          'বিদেশে কর্মসংস্থান ও প্রক্রিয়া সংক্রান্ত প্রয়োজনীয় প্রশ্নোত্তর',
          style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 12),

        // FAQ Expansion Tiles
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _faqs.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final f = _faqs[index];
            return Material(
              color: Colors.white,
              clipBehavior: Clip.antiAlias,
              shape: RoundedRectangleBorder(
                side: const BorderSide(color: Color(0xFFE2E8F0)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Theme(
                data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                child: ExpansionTile(
                  tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                  childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
                  leading: const Icon(
                    Icons.question_answer_outlined,
                    size: 16,
                    color: AppColors.corporateNavy,
                  ),
                  title: Text(
                    f['q']!,
                    style: const TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: AppColors.corporateNavy,
                    ),
                  ),
                  children: [
                    Text(
                      f['a']!,
                      style: const TextStyle(
                        fontSize: 11.5,
                        color: AppColors.textSecondary,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
