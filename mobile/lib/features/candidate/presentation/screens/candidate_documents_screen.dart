import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/candidate/data/candidate_models.dart';
import 'package:shakil_travels/features/candidate/data/candidate_repository.dart';

class CandidateDocumentsScreen extends StatefulWidget {
  final CandidateRepository? repository;

  const CandidateDocumentsScreen({super.key, this.repository});

  @override
  State<CandidateDocumentsScreen> createState() =>
      _CandidateDocumentsScreenState();
}

class _CandidateDocumentsScreenState extends State<CandidateDocumentsScreen> {
  late final CandidateRepository _repository;
  bool _isLoading = true;
  String? _errorMessage;

  List<CandidateDocumentModel> _documents = [];
  List<DocumentTypeModel> _documentTypes = [];

  @override
  void initState() {
    super.initState();
    _repository =
        widget.repository ?? CandidateRepository(apiClient: ApiClient());
    _loadDocuments();
  }

  Future<void> _loadDocuments() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _repository.getDocuments();
      if (mounted) {
        setState(() {
          _documents =
              result['documents'] as List<CandidateDocumentModel>? ?? [];
          _documentTypes =
              result['documentTypes'] as List<DocumentTypeModel>? ?? [];
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
        title: const Text('ডকুমেন্ট হাব (Document Hub)'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _isLoading ? null : _loadDocuments,
            tooltip: 'রিফ্রেশ করুন',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showUploadBottomSheet,
        backgroundColor: AppColors.corporateNavy,
        icon: const Icon(
          Icons.upload_file_rounded,
          color: AppColors.surfaceWhite,
        ),
        label: const Text(
          'ডকুমেন্ট জমা দিন',
          style: TextStyle(
            color: AppColors.surfaceWhite,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: LoadingIndicator(message: 'কাগজপত্রের তথ্য লোড হচ্ছে...'),
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

    return RefreshIndicator(
      onRefresh: _loadDocuments,
      color: AppColors.corporateNavy,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildChecklistCard(),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'দাখিলকৃত ডকুমেন্টস (${_documents.length})',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppColors.deepNavy,
                ),
              ),
              TextButton.icon(
                onPressed: _showUploadBottomSheet,
                icon: const Icon(Icons.add_rounded, size: 18),
                label: const Text('নতুন ফাইল'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_documents.isEmpty)
            _buildEmptyDocumentState()
          else
            ...List.generate(_documents.length, (index) {
              final doc = _documents[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _buildDocumentCard(doc),
              );
            }),
          const SizedBox(height: 80), // Extra space for FAB
        ],
      ),
    );
  }

  Widget _buildChecklistCard() {
    final hasPassport = _documents.any(
      (d) => d.documentType?.code.toUpperCase().contains('PASS') == true,
    );
    final hasNid = _documents.any(
      (d) => d.documentType?.code.toUpperCase().contains('NID') == true,
    );
    final hasPhoto = _documents.any(
      (d) => d.documentType?.code.toUpperCase().contains('PHOTO') == true,
    );
    final hasMedical = _documents.any(
      (d) => d.documentType?.code.toUpperCase().contains('MED') == true,
    );

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(
                Icons.checklist_rtl_rounded,
                color: AppColors.corporateNavy,
                size: 22,
              ),
              SizedBox(width: 8),
              Text(
                'বাধ্যতামূলক নিয়োগ ডকুমেন্টের অগ্রগতি',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.deepNavy,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildChecklistItem(
            'পাসপোর্ট (মূল কপি / স্ক্যান)',
            hasPassport,
            'Passport',
          ),
          _buildChecklistItem(
            'জাতীয় পরিচয়পত্র (NID / স্মার্ট কার্ড)',
            hasNid,
            'National ID',
          ),
          _buildChecklistItem(
            'সদ্য তোলা পাসপোর্ট সাইজ ছবি',
            hasPhoto,
            'Recent Photo',
          ),
          _buildChecklistItem(
            'মেডিকেল ফিটনেস সার্টিফিকেট (যদি থাকে)',
            hasMedical,
            'Medical Report',
          ),
        ],
      ),
    );
  }

  Widget _buildChecklistItem(String title, bool isProvided, String subtitle) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(
            isProvided
                ? Icons.check_circle_rounded
                : Icons.radio_button_unchecked_rounded,
            color: isProvided ? AppColors.success : AppColors.textDisabled,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isProvided ? FontWeight.w600 : FontWeight.w400,
                    color: isProvided
                        ? AppColors.textPrimary
                        : AppColors.textSecondary,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textDisabled,
                  ),
                ),
              ],
            ),
          ),
          Text(
            isProvided ? 'দাখিলকৃত' : 'প্রয়োজন',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: isProvided ? AppColors.success : AppColors.warning,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentCard(CandidateDocumentModel doc) {
    final typeName = doc.documentType?.name ?? 'সাধারণ ডকুমেন্ট';
    final sizeStr = doc.fileSize > 0
        ? '${(doc.fileSize / (1024 * 1024)).toStringAsFixed(2)} MB'
        : 'ফাইল';

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
                    child: Icon(
                      _getFileIcon(doc.mimeType),
                      color: AppColors.corporateNavy,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        typeName,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.deepNavy,
                        ),
                      ),
                      Text(
                        doc.fileName,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              _buildDocStatusBadge(doc.status),
            ],
          ),
          if (doc.rejectionReason != null &&
              doc.rejectionReason!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.errorLight,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.info_outline_rounded,
                    color: AppColors.error,
                    size: 16,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'বাতিলের কারণ: ${doc.rejectionReason}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.error,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'সাইজ: $sizeStr • ফরম্যাট: ${doc.mimeType.split('/').last.toUpperCase()}',
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textDisabled,
                ),
              ),
              if (doc.createdAt.isNotEmpty)
                Text(
                  doc.createdAt.split('T').first,
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
  }

  Widget _buildDocStatusBadge(String status) {
    final st = status.toUpperCase();
    if (st == 'VERIFIED') {
      return StatusBadge.verified('যাচাইকৃত');
    } else if (st == 'REJECTED') {
      return StatusBadge.rejected('বাতিল');
    } else if (st == 'UNDER_REVIEW') {
      return StatusBadge.underReview('যাচাই চলছে');
    }
    return StatusBadge.uploaded('জমা হয়েছে');
  }

  IconData _getFileIcon(String mimeType) {
    if (mimeType.contains('pdf')) return Icons.picture_as_pdf_rounded;
    if (mimeType.contains('image')) return Icons.image_rounded;
    return Icons.insert_drive_file_rounded;
  }

  Widget _buildEmptyDocumentState() {
    return const AppCard(
      padding: EdgeInsets.all(24),
      child: Column(
        children: [
          Icon(
            Icons.folder_open_rounded,
            size: 48,
            color: AppColors.corporatePink,
          ),
          SizedBox(height: 12),
          Text(
            'এখনো কোনো ডকুমেন্ট আপলোড করা হয়নি',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.deepNavy,
            ),
          ),
          SizedBox(height: 6),
          Text(
            'ভিসা প্রসেসিং ও সরকারি অনুমোদনের জন্য আপনার পাসপোর্ট ও পরিচয়পত্র আপলোড করুন। সর্বোচ্চ ফাইলের সাইজ ১০ মেগাবাইট।',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  void _showUploadBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return _UploadDocumentSheet(
          documentTypes: _documentTypes,
          repository: _repository,
          onSuccess: () {
            Navigator.pop(context);
            _loadDocuments();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('ডকুমেন্ট সফলভাবে আপলোড হয়েছে।'),
                backgroundColor: AppColors.success,
              ),
            );
          },
        );
      },
    );
  }
}

class _UploadDocumentSheet extends StatefulWidget {
  final List<DocumentTypeModel> documentTypes;
  final CandidateRepository repository;
  final VoidCallback onSuccess;

  const _UploadDocumentSheet({
    required this.documentTypes,
    required this.repository,
    required this.onSuccess,
  });

  @override
  State<_UploadDocumentSheet> createState() => _UploadDocumentSheetState();
}

class _UploadDocumentSheetState extends State<_UploadDocumentSheet> {
  String? _selectedTypeId;
  final _filePathController = TextEditingController();
  final _notesController = TextEditingController();
  final _passportNoController = TextEditingController();
  final _expiryDateController = TextEditingController();

  bool _isUploading = false;
  String? _uploadError;

  @override
  void initState() {
    super.initState();
    if (widget.documentTypes.isNotEmpty) {
      _selectedTypeId = widget.documentTypes.first.id;
    }
  }

  @override
  void dispose() {
    _filePathController.dispose();
    _notesController.dispose();
    _passportNoController.dispose();
    _expiryDateController.dispose();
    super.dispose();
  }

  bool get _isPassportSelected {
    if (_selectedTypeId == null) return false;
    final match =
        widget.documentTypes.where((t) => t.id == _selectedTypeId).firstOrNull;
    return match?.code.toUpperCase().contains('PASS') == true;
  }

  Future<void> _handleUpload() async {
    final path = _filePathController.text.trim();
    if (_selectedTypeId == null) {
      setState(
        () => _uploadError = 'অনুগ্রহ করে ডকুমেন্টের ধরন নির্বাচন করুন।',
      );
      return;
    }
    if (path.isEmpty) {
      setState(
        () => _uploadError = 'অনুগ্রহ করে ফাইলের পাথ অথবা ফাইল নির্বাচন করুন।',
      );
      return;
    }

    final ext = path.toLowerCase().split('.').last;
    if (!['pdf', 'jpg', 'jpeg', 'png', 'webp'].contains(ext)) {
      setState(() => _uploadError = 'অনুমোদিত ফরম্যাট: PDF, JPG, PNG, WEBP');
      return;
    }

    setState(() {
      _isUploading = true;
      _uploadError = null;
    });

    try {
      final fileName = path.split(RegExp(r'[/\\]')).last;
      await widget.repository.uploadDocument(
        documentTypeId: _selectedTypeId!,
        filePath: path,
        fileName: fileName,
        notes: _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
        passportNumber: _passportNoController.text.trim().isEmpty
            ? null
            : _passportNoController.text.trim(),
        expiryDate: _expiryDateController.text.trim().isEmpty
            ? null
            : _expiryDateController.text.trim(),
      );

      widget.onSuccess();
    } catch (e) {
      setState(() {
        _isUploading = false;
        _uploadError = e.toString().replaceFirst('ApiException: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'নতুন ডকুমেন্ট আপলোড',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppColors.deepNavy,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const Divider(color: AppColors.cardBorder),
            const SizedBox(height: 8),
            if (_uploadError != null) ...[
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.errorLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.error_outline_rounded,
                      color: AppColors.error,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _uploadError!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.error,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],
            const Text(
              'ডকুমেন্টের ধরন (Document Type)',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              initialValue: _selectedTypeId,
              isExpanded: true,
              decoration: InputDecoration(
                filled: true,
                fillColor: AppColors.pageBackground,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppColors.cardBorder),
                ),
              ),
              items: widget.documentTypes.map((t) {
                return DropdownMenuItem(
                  value: t.id,
                  child: Text(
                    '${t.name} (${t.code})',
                    style: const TextStyle(fontSize: 13),
                  ),
                );
              }).toList(),
              onChanged: (val) {
                setState(() => _selectedTypeId = val);
              },
            ),
            const SizedBox(height: 14),
            const Text(
              'ফাইল পাথ / ডিভাইসের ফাইল (Max 10MB)',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _filePathController,
              decoration: InputDecoration(
                hintText: 'উদা: /storage/emulated/0/Download/passport.pdf',
                hintStyle: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textDisabled,
                ),
                filled: true,
                fillColor: AppColors.pageBackground,
                prefixIcon: const Icon(Icons.attach_file_rounded, size: 20),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppColors.cardBorder),
                ),
              ),
            ),
            const SizedBox(height: 14),
            if (_isPassportSelected) ...[
              const Text(
                'পাসপোর্ট নম্বর',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _passportNoController,
                decoration: InputDecoration(
                  hintText: 'A01234567',
                  filled: true,
                  fillColor: AppColors.pageBackground,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppColors.cardBorder),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                'পাসপোর্টের মেয়াদোত্তীর্ণ তারিখ (Expiry Date)',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _expiryDateController,
                decoration: InputDecoration(
                  hintText: 'YYYY-MM-DD (উদা: 2030-12-31)',
                  filled: true,
                  fillColor: AppColors.pageBackground,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppColors.cardBorder),
                  ),
                ),
              ),
              const SizedBox(height: 14),
            ],
            const Text(
              'মন্তব্য বা নোট (Optional)',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _notesController,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'ডকুমেন্ট সংক্রান্ত কোনো বিবরণ থাকলে লিখুন...',
                hintStyle: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textDisabled,
                ),
                filled: true,
                fillColor: AppColors.pageBackground,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppColors.cardBorder),
                ),
              ),
            ),
            const SizedBox(height: 20),
            AppButton(
              text: _isUploading ? 'আপলোড হচ্ছে...' : 'আপলোড নিশ্চিত করুন',
              icon: Icons.cloud_upload_rounded,
              isLoading: _isUploading,
              onPressed: _isUploading ? null : _handleUpload,
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }
}
