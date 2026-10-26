import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/candidate/data/candidate_models.dart';
import 'package:shakil_travels/features/candidate/data/candidate_repository.dart';

class CandidatePaymentsScreen extends StatefulWidget {
  final CandidateRepository? repository;

  const CandidatePaymentsScreen({super.key, this.repository});

  @override
  State<CandidatePaymentsScreen> createState() =>
      _CandidatePaymentsScreenState();
}

class _CandidatePaymentsScreenState extends State<CandidatePaymentsScreen>
    with SingleTickerProviderStateMixin {
  late final CandidateRepository _repository;
  late final TabController _tabController;

  bool _isLoading = true;
  String? _errorMessage;
  CandidateFinanceSummaryModel? _financeData;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _repository =
        widget.repository ?? CandidateRepository(apiClient: ApiClient());
    _loadFinanceSummary();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadFinanceSummary() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final summary = await _repository.getFinanceSummary();
      if (mounted) {
        setState(() {
          _financeData = summary;
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
        title: const Text('হিসাব বিবরণী ও পেমেন্ট (Finance)'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _isLoading ? null : _loadFinanceSummary,
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
        child: LoadingIndicator(message: 'আর্থিক বিবরণী লোড হচ্ছে...'),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ErrorView(
            message: _errorMessage!,
            onRetry: _loadFinanceSummary,
          ),
        ),
      );
    }

    final data = _financeData;
    if (data == null) {
      return const Center(child: Text('কোনো হিসাব তথ্য পাওয়া যায়নি।'));
    }

    return RefreshIndicator(
      onRefresh: _loadFinanceSummary,
      color: AppColors.corporateNavy,
      child: Column(
        children: [
          _buildSummaryOverviewCard(data),
          TabBar(
            controller: _tabController,
            labelColor: AppColors.corporateNavy,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.corporateNavy,
            indicatorWeight: 3,
            tabs: [
              Tab(text: 'ইনভয়েস বা বিল (${data.invoices.length})'),
              Tab(text: 'জমা বা পেমেন্ট (${data.payments.length})'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildInvoicesList(data.invoices),
                _buildPaymentsList(data.payments),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryOverviewCard(CandidateFinanceSummaryModel data) {
    return Container(
      color: AppColors.surfaceWhite,
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          AppCard(
            backgroundColor: AppColors.corporateNavy,
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'বর্তমান বকেয়া স্থিতি (Total Outstanding Due)',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.corporatePink,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '৳ ${_formatCurrency(data.totalDue)}',
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: AppColors.surfaceWhite,
                  ),
                ),
                const SizedBox(height: 14),
                const Divider(color: Colors.white24, height: 1),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildSubSummary(
                      'মোট ধার্যকৃত বিল',
                      data.totalInvoiced,
                      AppColors.surfaceWhite,
                    ),
                    _buildSubSummary(
                      'মোট পরিশোধিত',
                      data.totalPaid,
                      AppColors.success,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          _buildSecurityAdvisory(),
        ],
      ),
    );
  }

  Widget _buildSubSummary(String title, double amount, Color amountColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 11,
            color: AppColors.surfaceWhite.withValues(alpha: 0.8),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          '৳ ${_formatCurrency(amount)}',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: amountColor,
          ),
        ),
      ],
    );
  }

  Widget _buildSecurityAdvisory() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.goldLight,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
      ),
      child: const Row(
        children: [
          Icon(Icons.verified_user_rounded, color: AppColors.warning, size: 20),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'শাকিল ট্রাভেলসের অফিসিয়াল ব্যাংক একাউন্ট বা ক্যাশ কাউন্টার ব্যতীত কোনো মধ্যস্থতাকারীকে টাকা দিবেন না।',
              style: TextStyle(
                fontSize: 11,
                color: AppColors.textPrimary,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInvoicesList(List<InvoiceModel> invoices) {
    if (invoices.isEmpty) {
      return _buildEmptySection('কোনো বিল বা ইনভয়েস ইস্যু করা হয়নি');
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: invoices.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final inv = invoices[index];
        return AppCard(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'ইনভয়েস #${inv.invoiceNumber}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: AppColors.deepNavy,
                    ),
                  ),
                  _buildInvoiceStatusBadge(inv.status, inv.dueAmount),
                ],
              ),
              if (inv.jobTitle != null) ...[
                const SizedBox(height: 4),
                Text(
                  'পেশা: ${inv.jobTitle}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
              const SizedBox(height: 8),
              const Divider(height: 1, color: AppColors.cardBorder),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'মোট অঙ্ক: ৳ ${_formatCurrency(inv.totalAmount)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    'পরিশোধ: ৳ ${_formatCurrency(inv.paidAmount)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.success,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'ইস্যু: ${inv.invoiceDate.split('T').first}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textDisabled,
                    ),
                  ),
                  Text(
                    'বকেয়া: ৳ ${_formatCurrency(inv.dueAmount)}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: inv.dueAmount > 0
                          ? AppColors.error
                          : AppColors.success,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPaymentsList(List<PaymentModel> payments) {
    if (payments.isEmpty) {
      return _buildEmptySection('এখনো কোনো পেমেন্ট জমা হয়নি');
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: payments.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final p = payments[index];
        return AppCard(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.receipt_long_rounded,
                        color: AppColors.corporateNavy,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'রশিদ #${p.receiptNumber ?? p.paymentNumber}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: AppColors.deepNavy,
                        ),
                      ),
                    ],
                  ),
                  StatusBadge.verified(
                    p.status == 'COMPLETED' ? 'জমা গৃহীত' : p.status,
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'মাধ্যম: ${_formatMethod(p.paymentMethod)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  Text(
                    '৳ ${_formatCurrency(p.amount)}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppColors.success,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'তারিখ: ${p.paymentDate.split('T').first}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textDisabled,
                    ),
                  ),
                  if (p.invoiceNumber != null)
                    Text(
                      'ইনভয়েস: #${p.invoiceNumber}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textDisabled,
                      ),
                    ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildInvoiceStatusBadge(String status, double due) {
    if (status == 'PAID' || due <= 0) {
      return StatusBadge.verified('পরিশোধিত');
    } else if (status == 'PARTIALLY_PAID') {
      return StatusBadge.underReview('আংশিক পরিশোধ');
    }
    return StatusBadge.rejected('বকেয়া');
  }

  Widget _buildEmptySection(String text) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.account_balance_wallet_outlined,
              size: 48,
              color: AppColors.corporatePink,
            ),
            const SizedBox(height: 12),
            Text(
              text,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
  }

  String _formatMethod(String method) {
    switch (method.toUpperCase()) {
      case 'BANK_TRANSFER':
        return 'ব্যাংক ট্রান্সফার';
      case 'BKASH':
        return 'বিকাশ (bKash)';
      case 'CASH':
        return 'অফিস ক্যাশ কাউন্টার';
      default:
        return 'অফিসিয়াল রিসিপ্ট';
    }
  }
}
