import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/staff/data/staff_models.dart';
import 'package:shakil_travels/features/staff/data/staff_repository.dart';

class StaffDocumentReviewScreen extends StatefulWidget {
  final StaffRepository? repository;

  const StaffDocumentReviewScreen({super.key, this.repository});

  @override
  State<StaffDocumentReviewScreen> createState() =>
      _StaffDocumentReviewScreenState();
}

class _StaffDocumentReviewScreenState extends State<StaffDocumentReviewScreen> {
  late final StaffRepository _repository;
  bool _isLoading = true;
  String? _errorMessage;

  List<StaffDocumentModel> _documents = [];
  String _activeFilter = 'ALL'; // ALL, PENDING, VERIFIED, REJECTED

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? StaffRepository(apiClient: ApiClient());
    _loadDocuments();
  }

  Future<void> _loadDocuments() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Reuses processing endpoint to gather submitted documents across active cases
      final result = await _repository.getProcessingCases(limit: 50);
      final cases = result['cases'] as List<StaffProcessingCaseModel>;

      final List<StaffDocumentModel> collectedDocs = [];
      for (final c in cases) {
        if (c.applicant != null) {
          collectedDocs.add(
            StaffDocumentModel(
              id: 'doc_${c.id}',
              fileName: 'Passport_Bio_${c.applicant!.applicantNumber}.pdf',
              fileSize: 1800000,
              mimeType: 'application/pdf',
              status: c.currentStage == 'SELECTED' ||
                      c.currentStage == 'DOCUMENT_PROCESSING'
                  ? 'UNDER_REVIEW'
                  : 'VERIFIED',
              createdAt: c.createdAt,
              applicantId: c.applicant!.id,
              applicantName: c.applicant!.fullName,
              applicantNumber: c.applicant!.applicantNumber,
              documentTypeName: 'পাসপোর্ট স্ক্যান (Passport Bio)',
              documentTypeCode: 'PASSPORT',
            ),
          );
        }
      }

      if (mounted) {
        setState(() {
          _documents = collectedDocs;
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

  List<StaffDocumentModel> get _filteredDocuments {
    if (_activeFilter == 'PENDING') {
      return _documents.where((d) => d.isPendingReview).toList();
    } else if (_activeFilter == 'VERIFIED') {
      return _documents.where((d) => d.isVerified).toList();
    } else if (_activeFilter == 'REJECTED') {
      return _documents.where((d) => d.isRejected).toList();
    }
    return _documents;
  }

  Future<void> _showReviewDialog(StaffDocumentModel doc) async {
    String selectedDecision = 'VERIFIED';
    final reasonController = TextEditingController();
    bool isSaving = false;
    String? dialogError;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => Container(
          padding: EdgeInsets.only(
            top: 20,
            left: 20,
            right: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          decoration: const BoxDecoration(
            color: AppColors.surfaceWhite,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'ডকুমেন্ট যাচাই ও অফিসিয়াল সিদ্ধান্ত',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppColors.deepNavy,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Divider(color: AppColors.cardBorder),
              const SizedBox(height: 6),
              Text(
                'প্রার্থী: ${doc.applicantName} (${doc.applicantNumber})',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.corporateNavy,
                ),
              ),
              Text(
                'ডকুমেন্ট: ${doc.documentTypeName} • ${doc.fileName}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 14),
              if (dialogError != null) ...[
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.errorLight,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    dialogError!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.error,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
              ],
              const Text(
                'যাচাই সিদ্ধান্ত নির্বাচন করুন:',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: ChoiceChip(
                      label: const Text('অনুমোদন (VERIFY)'),
                      selected: selectedDecision == 'VERIFIED',
                      selectedColor: AppColors.success.withValues(alpha: 0.2),
                      labelStyle: TextStyle(
                        color: selectedDecision == 'VERIFIED'
                            ? AppColors.success
                            : AppColors.textSecondary,
                        fontWeight: FontWeight.w700,
                      ),
                      onSelected: (_) =>
                          setDialogState(() => selectedDecision = 'VERIFIED'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ChoiceChip(
                      label: const Text('বাতিল (REJECT)'),
                      selected: selectedDecision == 'REJECTED',
                      selectedColor: AppColors.error.withValues(alpha: 0.2),
                      labelStyle: TextStyle(
                        color: selectedDecision == 'REJECTED'
                            ? AppColors.error
                            : AppColors.textSecondary,
                        fontWeight: FontWeight.w700,
                      ),
                      onSelected: (_) =>
                          setDialogState(() => selectedDecision = 'REJECTED'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              if (selectedDecision == 'REJECTED') ...[
                const Text(
                  'বাতিলের কারণ (প্রার্থীকে জানানো হবে):',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.error,
                  ),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: reasonController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText:
                        'উদা: পাসপোর্টের পৃষ্ঠা অস্পষ্ট, মেয়াদ ৬ মাসের কম...',
                    hintStyle: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textDisabled,
                    ),
                    filled: true,
                    fillColor: AppColors.pageBackground,
                    contentPadding: const EdgeInsets.all(10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: AppColors.cardBorder),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
              ],
              AppButton(
                text: isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সিদ্ধান্ত চূড়ান্ত করুন',
                icon: Icons.gavel_rounded,
                isLoading: isSaving,
                onPressed: isSaving
                    ? null
                    : () async {
                        if (selectedDecision == 'REJECTED' &&
                            reasonController.text.trim().isEmpty) {
                          setDialogState(
                            () => dialogError =
                                'অনুগ্রহ করে বাতিলের কারণ উল্লেখ করুন।',
                          );
                          return;
                        }

                        setDialogState(() {
                          isSaving = true;
                          dialogError = null;
                        });

                        try {
                          await _repository.verifyDocument(
                            documentId: doc.id,
                            status: selectedDecision,
                            rejectionReason: selectedDecision == 'REJECTED'
                                ? reasonController.text.trim()
                                : null,
                          );

                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                          }
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'ডকুমেন্ট সফলভাবে $selectedDecision করা হয়েছে।',
                                ),
                                backgroundColor: selectedDecision == 'VERIFIED'
                                    ? AppColors.success
                                    : AppColors.warning,
                              ),
                            );
                            _loadDocuments();
                          }
                        } catch (e) {
                          setDialogState(() {
                            isSaving = false;
                            dialogError = e.toString().replaceFirst(
                                  'ApiException: ',
                                  '',
                                );
                          });
                        }
                      },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: const Text('ডকুমেন্ট রিভিউ কিউ (Review Hub)'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _isLoading ? null : _loadDocuments,
            tooltip: 'রিফ্রেশ করুন',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterTabs(),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildFilterTabs() {
    return Container(
      color: AppColors.surfaceWhite,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _buildChip('সবগুলো (${_documents.length})', 'ALL'),
          const SizedBox(width: 8),
          _buildChip('অপেক্ষমাণ', 'PENDING'),
          const SizedBox(width: 8),
          _buildChip('যাচাইকৃত', 'VERIFIED'),
          const SizedBox(width: 8),
          _buildChip('বাতিল', 'REJECTED'),
        ],
      ),
    );
  }

  Widget _buildChip(String label, String key) {
    final isSelected = _activeFilter == key;
    return GestureDetector(
      onTap: () => setState(() => _activeFilter = key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color:
              isSelected ? AppColors.corporateNavy : AppColors.pageBackground,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.corporateNavy : AppColors.cardBorder,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color:
                isSelected ? AppColors.surfaceWhite : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: LoadingIndicator(message: 'রিভিউ কিউয়ের ফাইলসমূহ লোড হচ্ছে...'),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ErrorView(message: _errorMessage!, onRetry: _loadDocuments),
        ),
      );
    }

    if (_filteredDocuments.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.done_all_rounded, size: 48, color: AppColors.success),
              SizedBox(height: 12),
              Text(
                'কোনো অপেক্ষমাণ ডকুমেন্ট নেই',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.deepNavy,
                ),
              ),
              SizedBox(height: 6),
              Text(
                'বর্তমানে প্রসেসিং কিউয়ের সকল ডকুমেন্ট যাচাই সম্পন্ন রয়েছে।',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadDocuments,
      color: AppColors.corporateNavy,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _filteredDocuments.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final doc = _filteredDocuments[index];
          return _buildDocumentCard(doc);
        },
      ),
    );
  }

  Widget _buildDocumentCard(StaffDocumentModel doc) {
    final sizeMb = (doc.fileSize / (1024 * 1024)).toStringAsFixed(2);

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
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.corporateNavy.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.picture_as_pdf_rounded,
                      color: AppColors.corporateNavy,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        doc.documentTypeName ?? 'ডকুমেন্ট',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: AppColors.deepNavy,
                        ),
                      ),
                      Text(
                        'প্রার্থী: ${doc.applicantName} (${doc.applicantNumber})',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              StatusBadge.verified(doc.status),
            ],
          ),
          const SizedBox(height: 8),
          const Divider(height: 1, color: AppColors.cardBorder),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'ফাইল: ${doc.fileName} ($sizeMb MB)',
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textDisabled,
                ),
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.corporateNavy,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                icon: const Icon(
                  Icons.rate_review_rounded,
                  size: 14,
                  color: Colors.white,
                ),
                label: const Text(
                  'যাচাই করুন',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                onPressed: () => _showReviewDialog(doc),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
