import 'dart:async';
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

class HomeHeroCard extends StatefulWidget {
  final ValueChanged<String>? onSearch;
  final VoidCallback? onFindJobsTap;
  final VoidCallback? onTrackFileTap;
  final VoidCallback? onPortalLoginTap;

  const HomeHeroCard({
    super.key,
    this.onSearch,
    this.onFindJobsTap,
    this.onTrackFileTap,
    this.onPortalLoginTap,
  });

  @override
  State<HomeHeroCard> createState() => _HomeHeroCardState();
}

class _HomeHeroCardState extends State<HomeHeroCard>
    with SingleTickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  late AnimationController _animController;
  late Animation<double> _pulseAnim;

  int _phraseIndex = 0;
  Timer? _tickerTimer;

  static const List<String> _animatedPhrases = [
    'বিদেশে নিশ্চিত ক্যারিয়ার ও সম্মানজনক পেশা',
    '৭ বছরের বিশ্বস্ত অভিজ্ঞতায় নিরাপদ প্রবাস যাত্রা',
    '১০০% সরকারি অনুমোদন ও স্বচ্ছ বিএমইটি ছাড়পত্র',
    'নেত্রকোনার মানুষের পাশে শাকিল ট্রাভেলস',
  ];

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    _pulseAnim = Tween<double>(begin: 0.85, end: 1.15).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );

    _tickerTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (mounted) {
        setState(() {
          _phraseIndex = (_phraseIndex + 1) % _animatedPhrases.length;
        });
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _animController.dispose();
    _tickerTimer?.cancel();
    super.dispose();
  }

  void _triggerSearch() {
    final query = _searchController.text.trim();
    if (query.isNotEmpty) {
      widget.onSearch?.call(query);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFE8F1FA),
            Color(0xFFF3F7FC),
            Color(0xFFE2ECF8),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFC8DCF0), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: AppColors.corporateNavy.withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Trust Pill with Glowing/Pulsing Dot
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(30),
              border: Border.all(color: const Color(0xFFC8DCF0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                ScaleTransition(
                  scale: _pulseAnim,
                  child: Container(
                    width: 7,
                    height: 7,
                    decoration: const BoxDecoration(
                      color: AppColors.success,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                const Flexible(
                  child: Text(
                    '৭ বছরের অভিজ্ঞতা  •  অনুমোদিত RL-2579',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppColors.corporateNavy,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 2. Main Title
          const Text(
            'বিদেশে নিশ্চিত ক্যারিয়ার ও\nনিরাপদ অভিবাসন',
            style: TextStyle(
              fontSize: 21,
              fontWeight: FontWeight.w900,
              color: AppColors.corporateNavy,
              height: 1.25,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 8),

          // 3. Animated Rotating Text
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: Text(
              _animatedPhrases[_phraseIndex],
              key: ValueKey<int>(_phraseIndex),
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w500,
                color: AppColors.textSecondary,
                height: 1.35,
              ),
            ),
          ),
          const SizedBox(height: 18),

          // 4. Search Box
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFC8DCF0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                const Icon(
                  Icons.search_rounded,
                  color: AppColors.textSecondary,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onSubmitted: (_) => _triggerSearch(),
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textPrimary,
                    ),
                    decoration: const InputDecoration(
                      hintText: 'পদবী বা দেশ দিয়ে খুঁজুন (যেমন: ড্রাইভার, কাতার)...',
                      hintStyle: TextStyle(
                        fontSize: 12,
                        color: AppColors.textMuted,
                      ),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 12),
                      isDense: true,
                    ),
                  ),
                ),
                InkWell(
                  onTap: _triggerSearch,
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.corporateNavy,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'খুঁজুন',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 5. Quick Action Pills
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _ActionPill(
                icon: Icons.work_outline_rounded,
                label: 'চাকরি খুঁজুন',
                color: AppColors.corporateNavy,
                onTap: widget.onFindJobsTap,
              ),
              _ActionPill(
                icon: Icons.track_changes_rounded,
                label: 'ফাইল ট্র্যাকিং',
                color: AppColors.success,
                onTap: widget.onTrackFileTap,
              ),
              _ActionPill(
                icon: Icons.lock_outline_rounded,
                label: 'লগইন পোর্টাল',
                color: const Color(0xFFC05621),
                onTap: widget.onPortalLoginTap,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActionPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  const _ActionPill({
    required this.icon,
    required this.label,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.3)),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
