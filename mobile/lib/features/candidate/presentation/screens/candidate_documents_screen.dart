import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/offline/offline_draft_service.dart';
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
          const SizedBox(height: 14),
          _buildCheckItem('আন্তর্জাতিক পাসপোর্ট (Passport)', hasPassport),
          const SizedBox(height: 8),
          _buildCheckItem('জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন', hasNid),
          const SizedBox(height: 8),
          _buildCheckItem('সদ্য তোলা পাসপোর্ট সাইজ ছবি (White BG)', hasPhoto),
          const SizedBox(height: 8),
          _buildCheckItem('মেডিকেল ফিটনেস সার্টিফিকেট (ঐচ্ছিক)', hasMedical),
        ],
      ),
    );
  }

  Widget _buildCheckItem(String title, bool isCompleted) {
    return Row(
      children: [
        Icon(
          isCompleted ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
          color: isCompleted ? AppColors.success : AppColors.textDisabled,
          size: 18,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isCompleted ? FontWeight.w600 : FontWeight.normal,
              color: isCompleted ? AppColors.deepNavy : AppColors.textSecondary,
              decoration: isCompleted ? TextDecoration.lineThrough : null,
            ),
          ),
        ),
        if (isCompleted)
          const Text(
            'সংযুক্ত',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.success,
            ),
          ),
      ],
    );
  }

  Widget _buildDocumentCard(CandidateDocumentModel doc) {
    final sizeKb = (doc.fileSize / 1024).round();
    final sizeStr = sizeKb > 1024
        ? '${(sizeKb / 1024).toStringAsFixed(1)} MB'
        : '$sizeKb KB';

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.pageBackground,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Icon(
                  _getFileIcon(doc.mimeType),
                  color: AppColors.corporateNavy,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      doc.documentType?.name ?? doc.fileName,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.deepNavy,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      doc.fileName,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              _buildDocStatusBadge(doc.status),
            ],
          ),
          if (doc.expiryDate != null && doc.expiryDate!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.corporateNavy.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'মেয়াদ: ${doc.expiryDate!.split('T').first}${doc.notes != null ? ' • ${doc.notes}' : ''}',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.corporateNavy,
                ),
              ),
            ),
          ],
          if (doc.status.toUpperCase() == 'REJECTED' &&
              doc.rejectionReason != null) ...[
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
                    size: 16,
                    color: AppColors.error,
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

  Future<void> _pickFromCamera() async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1920,
      );
      if (picked != null) {
        setState(() {
          _filePathController.text = picked.path;
          _uploadError = null;
        });
      }
    } catch (e) {
      setState(() => _uploadError = 'ক্যামেরা ব্যবহারে ত্রুটি: $e');
    }
  }

  Future<void> _pickFromGallery() async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
      );
      if (picked != null) {
        setState(() {
          _filePathController.text = picked.path;
          _uploadError = null;
        });
      }
    } catch (e) {
      setState(() => _uploadError = 'গ্যালারি থেকে ছবি নির্বাচনে ত্রুটি: $e');
    }
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
      );
      if (result != null && result.files.single.path != null) {
        setState(() {
          _filePathController.text = result.files.single.path!;
          _uploadError = null;
        });
      }
    } catch (e) {
      setState(() => _uploadError = 'ফাইল ব্রাউজে ত্রুটি: $e');
    }
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
    } on NetworkException catch (_) {
      final fileName = path.split(RegExp(r'[/\\]')).last;
      final draftService = OfflineDraftService();
      await draftService.queueDocumentUpload({
        'documentTypeId': _selectedTypeId!,
        'filePath': path,
        'fileName': fileName,
        'notes': _notesController.text.trim(),
        'passportNumber': _passportNoController.text.trim(),
        'expiryDate': _expiryDateController.text.trim(),
      });
      setState(() {
        _isUploading = false;
        _uploadError =
            'নেটওয়ার্ক সংযোগ নেই। ফাইলটি অফলাইন আপলোড কিউতে সংরক্ষিত হয়েছে। সংযোগ পেলেই স্বয়ংক্রিয়ভাবে আপলোড হবে।';
      });
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
              'ফাইল বেছে নিন (ক্যামেরা / ফাইল / গ্যালারি)',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      side: const BorderSide(color: AppColors.corporateNavy),
                    ),
                    icon: const Icon(Icons.camera_alt_rounded, size: 16, color: AppColors.corporateNavy),
                    label: const Text('ক্যামেরা', style: TextStyle(fontSize: 12, color: AppColors.corporateNavy, fontWeight: FontWeight.bold)),
                    onPressed: _isUploading ? null : _pickFromCamera,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      side: const BorderSide(color: AppColors.corporateNavy),
                    ),
                    icon: const Icon(Icons.photo_library_rounded, size: 16, color: AppColors.corporateNavy),
                    label: const Text('গ্যালারি', style: TextStyle(fontSize: 12, color: AppColors.corporateNavy, fontWeight: FontWeight.bold)),
                    onPressed: _isUploading ? null : _pickFromGallery,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      side: const BorderSide(color: AppColors.corporateNavy),
                    ),
                    icon: const Icon(Icons.attach_file_rounded, size: 16, color: AppColors.corporateNavy),
                    label: const Text('ফাইল', style: TextStyle(fontSize: 12, color: AppColors.corporateNavy, fontWeight: FontWeight.bold)),
                    onPressed: _isUploading ? null : _pickFile,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _filePathController,
              decoration: InputDecoration(
                hintText: 'ফাইলের পাথ অথবা ফাইল নির্বাচন করুন',
                hintStyle: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textDisabled,
                ),
                filled: true,
                fillColor: AppColors.pageBackground,
                prefixIcon: const Icon(Icons.insert_drive_file_outlined, size: 20),
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
