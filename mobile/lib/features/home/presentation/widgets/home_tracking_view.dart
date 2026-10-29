import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/notifications/notification_service.dart';
import '../../../../core/utils/support_launcher.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_card.dart';

class HomeTrackingView extends StatefulWidget {
  final String? initialQuery;
  final NotificationService? notificationService;

  const HomeTrackingView({
    super.key,
    this.initialQuery,
    this.notificationService,
  });

  @override
  State<HomeTrackingView> createState() => _HomeTrackingViewState();
}

class _HomeTrackingViewState extends State<HomeTrackingView> {
  late final TextEditingController _controller;
  bool _isSearching = false;
  Map<String, dynamic>? _trackedResult;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialQuery ?? '');
    if (widget.initialQuery != null && widget.initialQuery!.isNotEmpty) {
      _performSearch(widget.initialQuery!);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _performSearch(String query) async {
    final q = query.trim().toUpperCase();
    if (q.isEmpty) return;

    setState(() {
      _isSearching = true;
      _trackedResult = null;
    });

    // Simulate instant search / mock tracking progress for physical testing
    await Future.delayed(const Duration(milliseconds: 600));

    if (mounted) {
      setState(() {
        _isSearching = false;
        _trackedResult = {
          'passportNo': q,
          'candidateName': 'মোহাম্মদ রফিকুল ইসলাম',
          'country': 'সৌদি আরব (Saudi Arabia)',
          'countryFlag': '🇸🇦',
          'jobTitle': 'হেভি ভেহিকেল ড্রাইভার',
          'currentStageIndex': 2, // 0 to 4 (Stage 2: Visa Stamping in progress)
          'stages': [
            {'title': 'আবেদন ও বাছাই', 'status': 'সম্পন্ন', 'date': '১২ অক্টোবর ২০২৬'},
            {'title': 'মেডিকেল ফিটনেস', 'status': 'ফিট (Gamca Passed)', 'date': '১৮ অক্টোবর ২০২৬'},
            {'title': 'ভিসা প্রসেসিং', 'status': 'প্রক্রিয়াধীন (Embassy)', 'date': 'চলমান'},
            {'title': 'বিএমইটি স্মার্ট কার্ড', 'status': 'অপেক্ষমাণ', 'date': '-'},
            {'title': 'টিকেট ও ফ্লাইট', 'status': 'অপেক্ষমাণ', 'date': '-'},
          ],
        };
      });

      widget.notificationService?.addNotification(
        title: 'পাসপোর্ট $q এর অগ্রগতি ট্র্যাক করা হয়েছে',
        message: 'স্ট্যাটাস: ভিসা প্রসেসিং (সৌদি দূতাবাস)। মেডিকেল ফিটনেস উত্তীর্ণ।',
        category: 'TRACKING',
        relatedCode: q,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Tracking Search Card
          AppCard(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(
                      Icons.search_rounded,
                      color: AppColors.corporateNavy,
                      size: 22,
                    ),
                    SizedBox(width: 8),
                    Text(
                      'Quick Application Tracking',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Check the live status of your application or passport deployment.',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _controller,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    hintText: 'Enter Passport No. (e.g. A01234567 বা আবেদন নম্বর)',
                    prefixIcon: const Icon(Icons.badge_outlined, size: 20),
                    suffixIcon: _controller.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded, size: 18),
                            onPressed: () {
                              _controller.clear();
                              setState(() => _trackedResult = null);
                            },
                          )
                        : null,
                  ),
                  onSubmitted: _performSearch,
                ),
                const SizedBox(height: 12),
                AppButton(
                  text: 'Check Status',
                  isLoading: _isSearching,
                  icon: Icons.track_changes_rounded,
                  onPressed: () {
                    final query = _controller.text.trim();
                    if (query.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'Please enter a passport number or application ID',
                          ),
                        ),
                      );
                    } else {
                      _performSearch(query);
                    }
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Search Results
          if (_trackedResult != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFC8DCF0)),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.corporateNavy.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _trackedResult!['countryFlag'] as String,
                        style: const TextStyle(fontSize: 22),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.corporateNavy.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'পাসপোর্ট: ${_trackedResult!['passportNo']}',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.corporateNavy,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _trackedResult!['candidateName'] as String,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppColors.corporateNavy,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'পদবী: ${_trackedResult!['jobTitle']} • ${_trackedResult!['country']}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const Divider(height: 24),

                  const Text(
                    'ডিপ্লয়মেন্ট অগ্রগতি ট্র্যাকার',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // 5 Stages Stepper
                  ...List.generate(
                    (_trackedResult!['stages'] as List).length,
                    (index) {
                      final stage =
                          (_trackedResult!['stages'] as List)[index]
                              as Map<String, dynamic>;
                      final currentIdx =
                          _trackedResult!['currentStageIndex'] as int;
                      final isCompleted = index < currentIdx;
                      final isCurrent = index == currentIdx;

                      Color indicatorColor = AppColors.textMuted;
                      IconData indicatorIcon = Icons.radio_button_unchecked_rounded;

                      if (isCompleted) {
                        indicatorColor = AppColors.success;
                        indicatorIcon = Icons.check_circle_rounded;
                      } else if (isCurrent) {
                        indicatorColor = const Color(0xFF2563EB);
                        indicatorIcon = Icons.access_time_filled_rounded;
                      }

                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Column(
                            children: [
                              Icon(indicatorIcon, color: indicatorColor, size: 20),
                              if (index < (_trackedResult!['stages'] as List).length - 1)
                                Container(
                                  width: 2,
                                  height: 32,
                                  color: isCompleted
                                      ? AppColors.success
                                      : const Color(0xFFE2E8F0),
                                ),
                            ],
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        stage['title'] as String,
                                        style: TextStyle(
                                          fontSize: 12.5,
                                          fontWeight: isCurrent || isCompleted
                                              ? FontWeight.w700
                                              : FontWeight.w500,
                                          color: isCurrent
                                              ? const Color(0xFF2563EB)
                                              : (isCompleted
                                                  ? AppColors.corporateNavy
                                                  : AppColors.textSecondary),
                                        ),
                                      ),
                                      Text(
                                        stage['status'] as String,
                                        style: TextStyle(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.w700,
                                          color: isCompleted
                                              ? AppColors.success
                                              : (isCurrent
                                                  ? const Color(0xFF2563EB)
                                                  : AppColors.textMuted),
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (stage['date'] != '-') ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      'আপডেট: ${stage['date']}',
                                      style: const TextStyle(
                                        fontSize: 10,
                                        color: AppColors.textMuted,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                  const Divider(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppColors.success),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                          ),
                          icon: const Icon(
                              Icons.chat_bubble_outline_rounded,
                              color: AppColors.success,
                              size: 16),
                          label: const Text('WhatsApp জিজ্ঞাসা',
                              style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.success)),
                          onPressed: () {
                            SupportLauncher.openWhatsApp(
                              context: context,
                              message:
                                  'আসসালামু আলাইকুম, আমি পাসপোর্ট ${_trackedResult!['passportNo']} (${_trackedResult!['candidateName']}) এর অগ্রগতি সম্পর্কে আপডেট জানতে চাই।',
                            );
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(
                                color: AppColors.corporateNavy),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                          ),
                          icon: const Icon(Icons.phone_in_talk_rounded,
                              color: AppColors.corporateNavy, size: 16),
                          label: const Text('হেল্পলাইনে কল',
                              style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.corporateNavy)),
                          onPressed: () =>
                              SupportLauncher.callHelpline(context: context),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ] else ...[
            // Helpful Guide Card when not searched yet
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F6FC),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFCBDDF0)),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.info_outline_rounded,
                    color: AppColors.corporateNavy,
                    size: 20,
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'কীভাবে ফাইল ট্র্যাক করবেন?',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: AppColors.corporateNavy,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'আপনার পাসপোর্টের ৯ সংখ্যার নম্বর অথবা আবেদনপত্রের স্লিপ নম্বর দিয়ে সার্চ করুন। শাকিল ট্রাভেলস সেন্ট্রাল ইআরপি ডাটাবেজ থেকে রিয়েল-টাইম অগ্রগতি দেখতে পাবেন।',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
