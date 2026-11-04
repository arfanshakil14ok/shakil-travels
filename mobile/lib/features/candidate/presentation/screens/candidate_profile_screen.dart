import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:shakil_travels/features/auth/data/auth_repository.dart';
import 'package:shakil_travels/features/auth/data/session_model.dart';
import 'package:shakil_travels/features/auth/presentation/role_selection_screen.dart';
import 'package:shakil_travels/features/candidate/data/candidate_models.dart';
import 'package:shakil_travels/features/candidate/data/candidate_repository.dart';
import 'candidate_payments_screen.dart';

class CandidateProfileScreen extends StatefulWidget {
  final SessionModel session;
  final CandidateRepository? repository;
  final AuthRepository? authRepository;

  const CandidateProfileScreen({
    super.key,
    required this.session,
    this.repository,
    this.authRepository,
  });

  @override
  State<CandidateProfileScreen> createState() => _CandidateProfileScreenState();
}

class _CandidateProfileScreenState extends State<CandidateProfileScreen> {
  late final CandidateRepository _repository;
  late final AuthRepository _authRepository;

  bool _isLoading = true;
  bool _isSaving = false;
  String? _errorMessage;

  CandidateProfileModel? _profile;

  // Controllers for editable fields
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _fatherNameController = TextEditingController();
  final _motherNameController = TextEditingController();
  final _districtController = TextEditingController();
  final _upazilaController = TextEditingController();
  final _addressController = TextEditingController();
  final _permanentAddressController = TextEditingController();
  final _emergencyContactController = TextEditingController();
  final _educationController = TextEditingController();
  final _professionController = TextEditingController();
  final _experienceController = TextEditingController();
  final _skillsController = TextEditingController();
  final _passportNoController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _repository =
        widget.repository ?? CandidateRepository(apiClient: ApiClient());
    _authRepository =
        widget.authRepository ?? AuthRepository(apiClient: ApiClient());
    _loadProfile();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _fatherNameController.dispose();
    _motherNameController.dispose();
    _districtController.dispose();
    _upazilaController.dispose();
    _addressController.dispose();
    _permanentAddressController.dispose();
    _emergencyContactController.dispose();
    _educationController.dispose();
    _professionController.dispose();
    _experienceController.dispose();
    _skillsController.dispose();
    _passportNoController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final p = await _repository.getProfile();
      if (mounted) {
        setState(() {
          _profile = p;
          _populateControllers(p);
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

  void _populateControllers(CandidateProfileModel p) {
    _fullNameController.text = p.fullName;
    _emailController.text = p.email ?? '';
    _fatherNameController.text = p.fatherName ?? '';
    _motherNameController.text = p.motherName ?? '';
    _districtController.text = p.district ?? '';
    _upazilaController.text = p.upazila ?? '';
    _addressController.text = p.address ?? '';
    _permanentAddressController.text = p.permanentAddress ?? '';
    _emergencyContactController.text = p.emergencyContact ?? '';
    _educationController.text = p.education ?? '';
    _professionController.text = p.profession ?? '';
    _experienceController.text =
        p.yearsOfExperience > 0 ? p.yearsOfExperience.toString() : '';
    _skillsController.text = p.skills ?? '';
    _passportNoController.text = p.passportNumber ?? '';
  }

  Future<void> _handleSaveProfile() async {
    if (_profile == null) return;

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final updated = CandidateProfileModel(
        id: _profile!.id,
        applicantNumber: _profile!.applicantNumber,
        fullName: _fullNameController.text.trim().isNotEmpty
            ? _fullNameController.text.trim()
            : _profile!.fullName,
        fatherName: _fatherNameController.text.trim().isEmpty
            ? null
            : _fatherNameController.text.trim(),
        motherName: _motherNameController.text.trim().isEmpty
            ? null
            : _motherNameController.text.trim(),
        dateOfBirth: _profile!.dateOfBirth,
        gender: _profile!.gender,
        phone: _profile!.phone,
        email: _emailController.text.trim().isEmpty
            ? null
            : _emailController.text.trim(),
        nationality: _profile!.nationality,
        district: _districtController.text.trim().isEmpty
            ? null
            : _districtController.text.trim(),
        upazila: _upazilaController.text.trim().isEmpty
            ? null
            : _upazilaController.text.trim(),
        address: _addressController.text.trim().isEmpty
            ? null
            : _addressController.text.trim(),
        permanentAddress: _permanentAddressController.text.trim().isEmpty
            ? null
            : _permanentAddressController.text.trim(),
        emergencyContact: _emergencyContactController.text.trim().isEmpty
            ? null
            : _emergencyContactController.text.trim(),
        education: _educationController.text.trim().isEmpty
            ? null
            : _educationController.text.trim(),
        profession: _professionController.text.trim().isEmpty
            ? null
            : _professionController.text.trim(),
        yearsOfExperience: int.tryParse(_experienceController.text.trim()) ??
            _profile!.yearsOfExperience,
        skills: _skillsController.text.trim().isEmpty
            ? null
            : _skillsController.text.trim(),
        languages: _profile!.languages,
        passportAvailable: _passportNoController.text.trim().isNotEmpty ||
            _profile!.passportAvailable,
        passportNumber: _passportNoController.text.trim().isEmpty
            ? null
            : _passportNoController.text.trim(),
        passportExpiry: _profile!.passportExpiry,
        status: _profile!.status,
        profileCompletion: _profile!.profileCompletion,
        missingFields: _profile!.missingFields,
      );

      final saved = await _repository.updateProfile(updated);
      if (mounted) {
        setState(() {
          _profile = saved;
          _populateControllers(saved);
          _isSaving = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে।'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('ApiException: ', '')),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _handleSignOut() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('লগআউট নিশ্চিতকরণ'),
        content: const Text(
          'আপনি কি নিশ্চিত যে আপনার প্রার্থী একাউন্ট থেকে সাইন আউট করতে চান?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('বাতিল'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'সাইন আউট',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await _authRepository.logout();
      if (mounted) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const RoleSelectionScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: const Text('প্রার্থী প্রোফাইল (Candidate Profile)'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _isLoading ? null : _loadProfile,
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
        child: LoadingIndicator(message: 'প্রোফাইল তথ্য লোড হচ্ছে...'),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ErrorView(message: _errorMessage!, onRetry: _loadProfile),
        ),
      );
    }

    final p = _profile;
    if (p == null) {
      return const Center(child: Text('প্রোফাইল তথ্য পাওয়া যায়নি।'));
    }

    return RefreshIndicator(
      onRefresh: _loadProfile,
      color: AppColors.corporateNavy,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildProfileHeader(p),
          const SizedBox(height: 14),
          _buildQuickActionCards(),
          const SizedBox(height: 14),
          _buildEditableForm(p),
          const SizedBox(height: 16),
          AppButton(
            text: _isSaving
                ? 'সংরক্ষণ করা হচ্ছে...'
                : 'প্রোফাইল পরিবর্তন সংরক্ষণ করুন',
            icon: Icons.save_rounded,
            isLoading: _isSaving,
            onPressed: _isSaving ? null : _handleSaveProfile,
          ),
          const SizedBox(height: 24),
          _buildSignOutSection(),
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _buildProfileHeader(CandidateProfileModel p) {
    return AppCard(
      backgroundColor: AppColors.corporateNavy,
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: AppColors.corporatePink.withValues(alpha: 0.3),
            child: const Icon(
              Icons.person_rounded,
              color: AppColors.surfaceWhite,
              size: 38,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Text(
                        p.fullName,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: AppColors.surfaceWhite,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    StatusBadge.verified(p.status),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'রেজিস্ট্রেশন নম্বর: ${p.applicantNumber}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.corporatePink,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'মোবাইল: ${p.phone}',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.surfaceWhite.withValues(alpha: 0.85),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCards() {
    return Row(
      children: [
        Expanded(
          child: AppCard(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) =>
                      CandidatePaymentsScreen(repository: _repository),
                ),
              );
            },
            padding: const EdgeInsets.all(14),
            child: const Row(
              children: [
                Icon(
                  Icons.account_balance_wallet_rounded,
                  color: AppColors.corporateNavy,
                  size: 24,
                ),
                SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'আর্থিক হিসাব',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        'ইনভয়েস ও রসিদ',
                        style: TextStyle(
                          fontSize: 10,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  color: AppColors.textDisabled,
                  size: 18,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEditableForm(CandidateProfileModel p) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'ব্যক্তিগত ও পেশাগত তথ্য',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: AppColors.deepNavy,
            ),
          ),
          const SizedBox(height: 14),
          _buildReadOnlyField('প্রার্থীর মোবাইল নম্বর (লগইন আইডি)', p.phone),
          const SizedBox(height: 12),
          _buildFormField('পূর্ণ নাম (Full Name)', _fullNameController),
          const SizedBox(height: 12),
          _buildFormField('ইমেইল ঠিকানা (Email Address)', _emailController),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildFormField('পিতার নাম', _fatherNameController),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildFormField('মাতার নাম', _motherNameController),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildFormField('জেলা (District)', _districtController),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildFormField('উপজেলা (Upazila)', _upazilaController),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildFormField(
            'বর্তমান ঠিকানা (Current Address)',
            _addressController,
          ),
          const SizedBox(height: 12),
          _buildFormField(
            'স্থায়ী ঠিকানা (Permanent Address)',
            _permanentAddressController,
          ),
          const SizedBox(height: 12),
          _buildFormField(
            'জরুরি যোগাযোগের নম্বর (Emergency Contact)',
            _emergencyContactController,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildFormField(
                  'পেশা বা ট্রেড (Profession)',
                  _professionController,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildFormField(
                  'অভিজ্ঞতার বছর (Years Exp.)',
                  _experienceController,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildFormField('শিক্ষাগত যোগ্যতা (Education)', _educationController),
          const SizedBox(height: 12),
          _buildFormField('দক্ষতা ও ট্রেনিং (Skills)', _skillsController),
          const SizedBox(height: 12),
          _buildFormField(
            'পাসপোর্ট নম্বর (Passport Number)',
            _passportNoController,
          ),
        ],
      ),
    );
  }

  Widget _buildFormField(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
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
        ),
      ],
    );
  }

  Widget _buildReadOnlyField(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.pageBackground.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.cardBorder),
          ),
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSignOutSection() {
    return Center(
      child: TextButton.icon(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.error,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        ),
        icon: const Icon(Icons.logout_rounded, size: 20),
        label: const Text(
          'প্রার্থী একাউন্ট থেকে সাইন আউট করুন',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
        ),
        onPressed: _handleSignOut,
      ),
    );
  }
}
