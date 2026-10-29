import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

class HomeProcessRoadmap extends StatelessWidget {
  const HomeProcessRoadmap({super.key});

  static const List<Map<String, dynamic>> _steps = [
    {
      'step': '০১',
      'title': 'আবেদন ও যোগ্যতা বাছাই',
      'desc': 'পছন্দসই সার্কুলারে আবেদন করুন। অভিজ্ঞ কর্মকর্তাদের মাধ্যমে সঠিক বাছাই।',
      'icon': Icons.assignment_turned_in_rounded,
      'color': Color(0xFF2563EB),
    },
    {
      'step': '০২',
      'title': 'মেডিকেল ও স্কিল অ্যাসেসমেন্ট',
      'desc': 'সরকারি তালিকাভুক্ত মেডিকেল সেন্টার হতে স্বাস্থ্য পরীক্ষা ও প্রয়োজনীয় প্রশিক্ষণ।',
      'icon': Icons.medical_services_rounded,
      'color': Color(0xFF0284C7),
    },
    {
      'step': '০৩',
      'title': 'ভিসা ও বিএমইটি ছাড়পত্র',
      'desc': 'দূতাবাস থেকে বৈধ ভিসা এবং সরকারি বিএমইটি স্মার্ট ইমিগ্রেশন কার্ড সংগ্রহ।',
      'icon': Icons.verified_user_rounded,
      'color': Color(0xFF24856A),
    },
    {
      'step': '০৪',
      'title': 'ফ্লাইট ও প্রবাসে যোগদান',
      'desc': 'প্রাক-বহির্গমন দিকনির্দেশনা ও এয়ারপোর্টে সহায়তার মাধ্যমে কর্মস্থলে যাত্রা।',
      'icon': Icons.flight_takeoff_rounded,
      'color': Color(0xFF102B50),
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        const Row(
          children: [
            Icon(Icons.route_rounded, color: AppColors.corporateNavy, size: 18),
            SizedBox(width: 8),
            Text(
              'নিরাপদ অভিবাসন প্রক্রিয়া',
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
          '৪টি সহজ ও সম্পূর্ণ বৈধ ধাপে আপনার বিদেশ যাত্রা সম্পন্ন করুন',
          style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 12),

        // Steps List
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _steps.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final s = _steps[index];
            final color = s['color'] as Color;

            return Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Icon(
                        s['icon'] as IconData,
                        color: color,
                        size: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: color.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                s['step'] as String,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: color,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                s['title'] as String,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.corporateNavy,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          s['desc'] as String,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}
