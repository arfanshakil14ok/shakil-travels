import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/status_badge.dart';

class QrVerificationScreen extends StatefulWidget {
  final ApiClient? apiClient;
  final String? initialQuery;

  const QrVerificationScreen({
    super.key,
    this.apiClient,
    this.initialQuery,
  });

  @override
  State<QrVerificationScreen> createState() => _QrVerificationScreenState();
}

class _QrVerificationScreenState extends State<QrVerificationScreen> {
  late final ApiClient _apiClient;
  final _queryController = TextEditingController();

  bool _isSearching = false;
  String? _errorMessage;
  Map<String, dynamic>? _resultData;

  @override
  void initState() {
    super.initState();
    _apiClient = widget.apiClient ?? ApiClient();
    if (widget.initialQuery != null && widget.initialQuery!.isNotEmpty) {
      _queryController.text = widget.initialQuery!;
      _performSearch(widget.initialQuery!);
    }
  }

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  Future<void> _performSearch(String query) async {
    final clean = query.trim();
    if (clean.isEmpty) return;

    setState(() {
      _isSearching = true;
      _errorMessage = null;
      _resultData = null;
    });

    try {
      final response = await _apiClient.get(
        '${ApiEndpoints.track}?q=${Uri.encodeComponent(clean)}',
      );

      if (response is Map<String, dynamic> && response['success'] == true) {
        setState(() {
          _resultData = response['data'] as Map<String, dynamic>?;
          _isSearching = false;
        });
      } else {
        setState(() {
          _isSearching = false;
          _errorMessage =
              'কোনো প্রার্থীর তথ্য পাওয়া যায়নি। সঠিক পাসপোর্ট বা ক্যান্ডিডেট আইডি দিন।';
        });
      }
    } catch (e) {
      setState(() {
        _isSearching = false;
        _errorMessage = 'তথ্য অনুসন্ধানে ব্যর্থ হয়েছে: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: const Text('প্রার্থী ভেরিফিকেশন (Verification)'),
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AppCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Row(
                      children: [
                        Icon(
                          Icons.qr_code_scanner_rounded,
                          color: AppColors.corporateNavy,
                          size: 24,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'QR কোড বা আইডি দিয়ে যাচাই',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppColors.deepNavy,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'প্রার্থীর আইডি কার্ড, ভিসা স্লিপ বা রসিদের QR কোড থেকে পাওয়া ট্র্যাকিং কোড বা পাসপোর্ট নম্বর লিখুন:',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _queryController,
                      decoration: InputDecoration(
                        labelText: 'পাসপোর্ট / ক্যান্ডিডেট আইডি / ট্র্যাকিং নম্বর',
                        hintText: 'উদা: CAND-12345 বা A01234567',
                        prefixIcon: const Icon(Icons.search_rounded),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 12,
                        ),
                      ),
                      onSubmitted: _performSearch,
                    ),
                    const SizedBox(height: 12),
                    AppButton(
                      text: _isSearching ? 'অনুসন্ধান চলছে...' : 'যাচাই করুন',
                      icon: Icons.verified_user_rounded,
                      isLoading: _isSearching,
                      onPressed: _isSearching
                          ? null
                          : () => _performSearch(_queryController.text),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              if (_isSearching) ...[
                const SizedBox(height: 24),
                const Center(
                  child: LoadingIndicator(message: 'সার্ভার থেকে তথ্য যাচাই করা হচ্ছে...'),
                ),
              ] else if (_errorMessage != null) ...[
                ErrorView(
                  message: _errorMessage!,
                  onRetry: () => _performSearch(_queryController.text),
                ),
              ] else if (_resultData != null) ...[
                _buildVerificationCard(_resultData!),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildVerificationCard(Map<String, dynamic> data) {
    final fullName = data['fullName']?.toString() ?? 'নাম পাওয়া যায়নি';
    final applicantNo = data['applicantNumber']?.toString() ?? 'N/A';
    final passport = data['passportNumber']?.toString() ?? 'N/A';
    final stage = data['stage']?.toString() ?? 'UNDER_PROCESSING';
    final country = data['targetCountry']?.toString() ?? 'N/A';
    final trade = data['trade']?.toString() ?? 'N/A';
    final isMedicalFit = data['medicalFit'] == true;
    final isVisaStamped = data['visaStamped'] == true;
    final isBmetCleared = data['bmetCleared'] == true;

    return AppCard(
      padding: const EdgeInsets.all(18),
      border: Border.all(color: AppColors.success, width: 1.5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const CircleAvatar(
                radius: 24,
                backgroundColor: AppColors.corporateNavy,
                child: Icon(Icons.person_rounded, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      fullName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.deepNavy,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'আইডি: $applicantNo • পাসপোর্ট: $passport',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              StatusBadge.verified('সত্যায়িত'),
            ],
          ),
          const Divider(height: 24, color: AppColors.cardBorder),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('গন্তব্য দেশ:', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              Text(country, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.deepNavy)),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('পেশা (Trade):', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              Text(trade, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.deepNavy)),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('বর্তমান পর্যায়:', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              Text(stage, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.corporateNavy)),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            'ক্লিয়ারেন্স স্ট্যাটাস:',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.deepNavy),
          ),
          const SizedBox(height: 8),
          _buildStepRow('মেডিকেল ফিটনেস:', isMedicalFit),
          const SizedBox(height: 6),
          _buildStepRow('ভিসা স্ট্যাম্পিং:', isVisaStamped),
          const SizedBox(height: 6),
          _buildStepRow('বিএমইটি (BMET) ইমিগ্রেশন ছাড়পত্র:', isBmetCleared),
        ],
      ),
    );
  }

  Widget _buildStepRow(String label, bool passed) {
    return Row(
      children: [
        Icon(
          passed ? Icons.check_circle_rounded : Icons.pending_rounded,
          color: passed ? AppColors.success : AppColors.warning,
          size: 16,
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: AppColors.textPrimary),
        ),
        const Spacer(),
        Text(
          passed ? 'সম্পন্ন (Passed)' : 'প্রক্রিয়াধীন (Pending)',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: passed ? AppColors.success : AppColors.warning,
          ),
        ),
      ],
    );
  }
}
