import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/staff/data/staff_repository.dart';

class StaffApplicantDetailsScreen extends StatefulWidget {
  final String applicantId;
  final String applicantNumber;
  final StaffRepository? repository;

  const StaffApplicantDetailsScreen({
    super.key,
    required this.applicantId,
    required this.applicantNumber,
    this.repository,
  });

  @override
  State<StaffApplicantDetailsScreen> createState() =>
      _StaffApplicantDetailsScreenState();
}

class _StaffApplicantDetailsScreenState
    extends State<StaffApplicantDetailsScreen> {
  late final StaffRepository _repository;
  bool _isLoading = true;
  String? _errorMessage;

  Map<String, dynamic>? _applicantData;
  final _noteController = TextEditingController();
  bool _isSavingNote = false;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? StaffRepository(apiClient: ApiClient());
    _loadDossier();
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _loadDossier() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await _repository.getApplicantDetails(widget.applicantId);
      if (mounted) {
        setState(() {
          _applicantData = data;
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

  Future<void> _handleAddNote() async {
    final noteText = _noteController.text.trim();
    if (noteText.isEmpty) return;

    setState(() => _isSavingNote = true);

    try {
      await _repository.addApplicantNote(
        applicantId: widget.applicantId,
        content: noteText,
      );
      _noteController.clear();
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('অফিসিয়াল ইন্টারনাল নোট সফলভাবে সংরক্ষিত হয়েছে।'),
            backgroundColor: AppColors.success,
          ),
        );
        _loadDossier();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSavingNote = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('ApiException: ', '')),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _showAddNoteDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
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
                  'নতুন ইন্টারনাল স্টাফ নোট',
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
            const SizedBox(height: 8),
            const Text(
              'এই নোটটি শুধুমাত্র অনুমোদিত স্টাফ ও এডমিন দেখতে পাবেন (প্রার্থীর কাছে দৃশ্যমান নয়)।',
              style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _noteController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText:
                    'প্রার্থীর সাথে যোগাযোগ, স্কিল অ্যাসেসমেন্ট বা অগ্রগতি সংক্রান্ত নোট লিখুন...',
                hintStyle: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textDisabled,
                ),
                filled: true,
                fillColor: AppColors.pageBackground,
                contentPadding: const EdgeInsets.all(12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppColors.cardBorder),
                ),
              ),
            ),
            const SizedBox(height: 16),
            AppButton(
              text: _isSavingNote ? 'সংরক্ষণ হচ্ছে...' : 'নোট সংরক্ষণ করুন',
              icon: Icons.save_rounded,
              isLoading: _isSavingNote,
              onPressed: _isSavingNote ? null : _handleAddNote,
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: Text('প্রার্থী #${widget.applicantNumber}'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _isLoading ? null : _loadDossier,
            tooltip: 'রিফ্রেশ করুন',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddNoteDialog,
        backgroundColor: AppColors.corporateNavy,
        icon: const Icon(Icons.note_add_rounded, color: Colors.white),
        label: const Text(
          'নোট যোগ করুন',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: LoadingIndicator(
          message: 'প্রার্থীর বিস্তারিত ডসিয়ার লোড হচ্ছে...',
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ErrorView(message: _errorMessage!, onRetry: _loadDossier),
        ),
      );
    }

    final data = _applicantData ?? {};
    final fullName = data['fullName']?.toString() ?? 'Applicant';
    final phone = data['phone']?.toString() ?? '';
    final email = data['email']?.toString();
    final passport = data['passportNumber']?.toString();
    final district = data['district']?.toString();
    final upazila = data['upazila']?.toString();
    final profession = data['profession']?.toString();
    final experience = data['yearsOfExperience']?.toString();
    final status = data['status']?.toString() ?? 'NEW';

    final documents = (data['documents'] as List<dynamic>? ?? []);
    final notes = (data['notes'] as List<dynamic>? ?? []);
    final applications = (data['applications'] as List<dynamic>? ?? []);

    return RefreshIndicator(
      onRefresh: _loadDossier,
      color: AppColors.corporateNavy,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildBioCard(
            fullName,
            phone,
            email,
            passport,
            district,
            upazila,
            profession,
            experience,
            status,
          ),
          const SizedBox(height: 14),
          _buildApplicationsSection(applications),
          const SizedBox(height: 14),
          _buildDocumentsSection(documents),
          const SizedBox(height: 14),
          _buildNotesSection(notes),
          const SizedBox(height: 80), // Fab spacing
        ],
      ),
    );
  }

  Widget _buildBioCard(
    String name,
    String phone,
    String? email,
    String? passport,
    String? district,
    String? upazila,
    String? profession,
    String? experience,
    String status,
  ) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(
                  name,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.deepNavy,
                  ),
                ),
              ),
              StatusBadge.verified(status),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'রেজিস্ট্রেশন নম্বর: ${widget.applicantNumber}',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.corporatePink,
            ),
          ),
          const Divider(height: 18, color: AppColors.cardBorder),
          _buildBioRow(
            Icons.phone_rounded,
            'মোবাইল (Privacy Masked)',
            _maskPhone(phone),
          ),
          if (email != null && email.isNotEmpty)
            _buildBioRow(Icons.email_rounded, 'ইমেইল', email),
          if (passport != null && passport.isNotEmpty)
            _buildBioRow(
              Icons.badge_rounded,
              'পাসপোর্ট (Privacy Masked)',
              _maskPassport(passport),
            ),
          if (district != null && district.isNotEmpty)
            _buildBioRow(
              Icons.location_on_rounded,
              'ঠিকানা',
              '$district${upazila != null ? ', $upazila' : ''}',
            ),
          if (profession != null && profession.isNotEmpty)
            _buildBioRow(
              Icons.work_rounded,
              'পেশা ও অভিজ্ঞতা',
              '$profession (${experience ?? 0} বছর)',
            ),
        ],
      ),
    );
  }

  Widget _buildBioRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.corporateNavy),
          const SizedBox(width: 8),
          Text(
            '$label: ',
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.deepNavy,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildApplicationsSection(List<dynamic> apps) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'আবেদনসমূহ (Applications)',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.deepNavy,
                ),
              ),
              Text(
                '${apps.length} টি',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.corporateNavy,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (apps.isEmpty)
            const Text(
              'কোনো আবেদন রেকর্ড নেই।',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            )
          else
            ...apps.map((app) {
              final job = app['job'] as Map<String, dynamic>? ?? {};
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        job['title']?.toString() ?? 'Job Position',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    StatusBadge.processing(app['status']?.toString() ?? 'NEW'),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildDocumentsSection(List<dynamic> docs) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'দাখিলকৃত ডকুমেন্টস (Documents)',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.deepNavy,
                ),
              ),
              Text(
                '${docs.length} টি',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.corporateNavy,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (docs.isEmpty)
            const Text(
              'কোনো ডকুমেন্ট আপলোড করা হয়নি।',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            )
          else
            ...docs.map((d) {
              final type = d['documentType'] as Map<String, dynamic>? ?? {};
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 5),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.file_present_rounded,
                          size: 18,
                          color: AppColors.corporateNavy,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          type['name']?.toString() ??
                              d['fileName']?.toString() ??
                              'Document',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    StatusBadge.verified(d['status']?.toString() ?? 'UPLOADED'),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildNotesSection(List<dynamic> notes) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'ইন্টারনাল স্টাফ নোটস (Staff Notes)',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.deepNavy,
                ),
              ),
              TextButton.icon(
                onPressed: _showAddNoteDialog,
                icon: const Icon(Icons.add_rounded, size: 16),
                label: const Text('নোট দিন', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (notes.isEmpty)
            const Text(
              'কোনো ইন্টারনাল নোট প্রদান করা হয়নি।',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            )
          else
            ...notes.map((n) {
              final author = n['createdBy'] as Map<String, dynamic>? ?? {};
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.pageBackground,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          author['name']?.toString() ?? 'Staff Officer',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.corporateNavy,
                          ),
                        ),
                        Text(
                          (n['createdAt']?.toString() ?? '').split('T').first,
                          style: const TextStyle(
                            fontSize: 10,
                            color: AppColors.textDisabled,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      n['content']?.toString() ?? '',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textPrimary,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  String _maskPhone(String p) {
    if (p.length <= 6) return p;
    return '${p.substring(0, 4)}****${p.substring(p.length - 3)}';
  }

  String _maskPassport(String p) {
    if (p.length <= 4) return '***';
    return '${p.substring(0, 2)}***${p.substring(p.length - 2)}';
  }
}
