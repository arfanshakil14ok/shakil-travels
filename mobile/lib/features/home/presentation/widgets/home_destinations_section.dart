import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

class DestinationCountryItem {
  final String code;
  final String nameBn;
  final String nameEn;
  final String flag;
  final String vacancyLabel;

  const DestinationCountryItem({
    required this.code,
    required this.nameBn,
    required this.nameEn,
    required this.flag,
    required this.vacancyLabel,
  });
}

class HomeDestinationsSection extends StatelessWidget {
  final ValueChanged<String>? onCountryTap;

  const HomeDestinationsSection({super.key, this.onCountryTap});

  static const List<DestinationCountryItem> countries = [
    DestinationCountryItem(
      code: 'SA',
      nameBn: 'সৌদি আরব',
      nameEn: 'Saudi Arabia',
      flag: '🇸🇦',
      vacancyLabel: '২৫+ সার্কুলার',
    ),
    DestinationCountryItem(
      code: 'AE',
      nameBn: 'সংযুক্ত আরব আমিরাত',
      nameEn: 'UAE (Dubai)',
      flag: '🇦🇪',
      vacancyLabel: '১৫+ সার্কুলার',
    ),
    DestinationCountryItem(
      code: 'QA',
      nameBn: 'কাতার',
      nameEn: 'Qatar',
      flag: '🇶🇦',
      vacancyLabel: '৩০+ সার্কুলার',
    ),
    DestinationCountryItem(
      code: 'OM',
      nameBn: 'ওমান',
      nameEn: 'Oman',
      flag: '🇴🇲',
      vacancyLabel: '১০+ সার্কুলার',
    ),
    DestinationCountryItem(
      code: 'KW',
      nameBn: 'কুয়েত',
      nameEn: 'Kuwait',
      flag: '🇰🇼',
      vacancyLabel: '১২+ সার্কুলার',
    ),
    DestinationCountryItem(
      code: 'MY',
      nameBn: 'মালয়েশিয়া',
      nameEn: 'Malaysia',
      flag: '🇲🇾',
      vacancyLabel: '৫০+ সার্কুলার',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        const Row(
          children: [
            Icon(Icons.public_rounded, color: AppColors.corporateNavy, size: 18),
            SizedBox(width: 8),
            Text(
              'জনপ্রিয় গন্তব্য দেশসমূহ',
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
          'যেসব দেশে সরাসরি বৈধ প্রক্রিয়ায় কর্মী পাঠানোর সুযোগ রয়েছে',
          style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 12),

        // Horizontal Country Carousel
        SizedBox(
          height: 120,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: countries.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              final c = countries[index];
              return InkWell(
                onTap: () => onCountryTap?.call(c.code),
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  width: 130,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFC8DCF0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.02),
                        blurRadius: 6,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(c.flag, style: const TextStyle(fontSize: 22)),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.corporateNavy.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              c.code,
                              style: const TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: AppColors.corporateNavy,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        c.nameBn,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.corporateNavy,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        c.vacancyLabel,
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.success,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
