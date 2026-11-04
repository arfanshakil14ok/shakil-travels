import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/errors/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/security/secure_storage.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_logo.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../data/auth_repository.dart';
import '../../candidate/presentation/screens/candidate_main_navigation_screen.dart';

class CandidateRegisterScreen extends StatefulWidget {
  final AuthRepository? authRepository;

  const CandidateRegisterScreen({super.key, this.authRepository});

  @override
  State<CandidateRegisterScreen> createState() =>
      _CandidateRegisterScreenState();
}

class _CandidateRegisterScreenState extends State<CandidateRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _districtController = TextEditingController();

  String _candidateType = 'SKILLED';
  File? _profileImage;
  String? _profilePhotoBase64;
  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;

  late final AuthRepository _authRepository;

  // Minimal valid 1x1 base64 GIF fallback if user doesn't take photo immediately
  static const String _defaultAvatarBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  @override
  void initState() {
    super.initState();
    _authRepository = widget.authRepository ??
        AuthRepository(
          apiClient: ApiClient(),
          secureStorage: SecureStorageService(),
        );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _districtController.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: source,
        imageQuality: 70,
        maxWidth: 600,
        maxHeight: 600,
      );

      if (picked != null) {
        final bytes = await File(picked.path).readAsBytes();
        final ext = picked.path.split('.').last.toLowerCase();
        final mime = ext == 'png' ? 'image/png' : 'image/jpeg';
        final base64String = 'data:$mime;base64,${base64Encode(bytes)}';

        setState(() {
          _profileImage = File(picked.path);
          _profilePhotoBase64 = base64String;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('ছবি নির্বাচনে ত্রুটি: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _submitRegistration() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final photo = _profilePhotoBase64 ?? _defaultAvatarBase64;

      final session = await _authRepository.registerCandidate(
        fullName: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        password: _passwordController.text,
        confirmPassword: _confirmPasswordController.text,
        district: _districtController.text.trim().isEmpty
            ? null
            : _districtController.text.trim(),
        candidateType: _candidateType,
        profilePhotoBase64: photo,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('নিবন্ধন সফল হয়েছে! স্বাগতম।'),
          backgroundColor: AppColors.success,
        ),
      );

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (_) => CandidateMainNavigationScreen(session: session),
        ),
        (route) => false,
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.message);
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = 'নিবন্ধন সম্পন্ন করা সম্ভব হয়নি: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: const Text('প্রার্থী নিবন্ধন (Registration)'),
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Center(
                  child: AppLogo(size: 64, showTagline: false),
                ),
                const SizedBox(height: 12),
                const Text(
                  'শাকিল ট্রাভেলস রিক্রুটমেন্ট পোর্টালে আপনার একাউন্ট তৈরি করুন',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 20),

                // Profile Photo Section
                Center(
                  child: Stack(
                    children: [
                      CircleAvatar(
                        radius: 46,
                        backgroundColor: AppColors.cardBorder,
                        backgroundImage: _profileImage != null
                            ? FileImage(_profileImage!)
                            : null,
                        child: _profileImage == null
                            ? const Icon(
                                Icons.person_rounded,
                                size: 48,
                                color: AppColors.textDisabled,
                              )
                            : null,
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Material(
                          color: AppColors.corporateNavy,
                          shape: const CircleBorder(),
                          child: InkWell(
                            customBorder: const CircleBorder(),
                            onTap: () {
                              showModalBottomSheet(
                                context: context,
                                builder: (_) => SafeArea(
                                  child: Wrap(
                                    children: [
                                      ListTile(
                                        leading: const Icon(
                                          Icons.camera_alt_rounded,
                                          color: AppColors.corporateNavy,
                                        ),
                                        title: const Text('সেলফি তুলুন (Camera)'),
                                        onTap: () {
                                          Navigator.pop(context);
                                          _pickPhoto(ImageSource.camera);
                                        },
                                      ),
                                      ListTile(
                                        leading: const Icon(
                                          Icons.photo_library_rounded,
                                          color: AppColors.corporateNavy,
                                        ),
                                        title: const Text('গ্যালারি থেকে বেছে নিন'),
                                        onTap: () {
                                          Navigator.pop(context);
                                          _pickPhoto(ImageSource.gallery);
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                            child: const Padding(
                              padding: EdgeInsets.all(8.0),
                              child: Icon(
                                Icons.camera_alt_rounded,
                                color: Colors.white,
                                size: 18,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                const Center(
                  child: Text(
                    'পাসপোর্ট সাইজ ছবি আপলোড করুন (ঐচ্ছিক)',
                    style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  ),
                ),
                const SizedBox(height: 20),

                if (_errorMessage != null) ...[
                  AppCard(
                    backgroundColor: AppColors.errorLight,
                    border: Border.all(
                      color: AppColors.error.withValues(alpha: 0.3),
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.error_outline_rounded,
                          color: AppColors.error,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.error,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                AppCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      AppTextField(
                        controller: _nameController,
                        label: 'সম্পূর্ণ নাম (Full Name)',
                        hint: 'উদা: মো: শাকিল আহমেদ',
                        prefixIcon: Icons.badge_outlined,
                        validator: (val) {
                          if (val == null || val.trim().length < 2) {
                            return 'সম্পূর্ণ নাম লিখুন (কমপক্ষে ২ অক্ষর)';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),
                      AppTextField(
                        controller: _phoneController,
                        label: 'মোবাইল নম্বর (Phone Number)',
                        hint: '০১৭xxxxxxxx বা 019xxxxxxxx',
                        prefixIcon: Icons.phone_android_rounded,
                        keyboardType: TextInputType.phone,
                        validator: (val) {
                          if (val == null || val.trim().length < 6) {
                            return 'সঠিক মোবাইল নম্বর প্রদান করুন';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),
                      AppTextField(
                        controller: _districtController,
                        label: 'জেলা (District)',
                        hint: 'উদা: ঢাকা, চট্টগ্রাম, কুমিল্লা',
                        prefixIcon: Icons.location_on_outlined,
                      ),
                      const SizedBox(height: 14),
                      const Text(
                        'প্রার্থীর ধরন (Candidate Category)',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.deepNavy,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: ChoiceChip(
                              label: const Center(child: Text('দক্ষ (Skilled)')),
                              selected: _candidateType == 'SKILLED',
                              selectedColor: AppColors.corporateNavy,
                              labelStyle: TextStyle(
                                color: _candidateType == 'SKILLED'
                                    ? Colors.white
                                    : AppColors.deepNavy,
                                fontWeight: FontWeight.w600,
                              ),
                              onSelected: (_) {
                                setState(() => _candidateType = 'SKILLED');
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ChoiceChip(
                              label: const Center(child: Text('সাধারণ (Unskilled)')),
                              selected: _candidateType == 'UNSKILLED',
                              selectedColor: AppColors.corporateNavy,
                              labelStyle: TextStyle(
                                color: _candidateType == 'UNSKILLED'
                                    ? Colors.white
                                    : AppColors.deepNavy,
                                fontWeight: FontWeight.w600,
                              ),
                              onSelected: (_) {
                                setState(() => _candidateType = 'UNSKILLED');
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      AppTextField(
                        controller: _passwordController,
                        label: 'পাসওয়ার্ড (Password)',
                        hint: 'কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড',
                        prefixIcon: Icons.lock_outline_rounded,
                        obscureText: _obscurePassword,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            size: 20,
                          ),
                          onPressed: () {
                            setState(
                              () => _obscurePassword = !_obscurePassword,
                            );
                          },
                        ),
                        validator: (val) {
                          if (val == null || val.length < 6) {
                            return 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),
                      AppTextField(
                        controller: _confirmPasswordController,
                        label: 'পাসওয়ার্ড নিশ্চিত করুন',
                        hint: 'পুনরায় পাসওয়ার্ড লিখুন',
                        prefixIcon: Icons.lock_reset_rounded,
                        obscureText: _obscurePassword,
                        validator: (val) {
                          if (val != _passwordController.text) {
                            return 'পাসওয়ার্ড দুটি মিলছে না';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 20),
                      AppButton(
                        text: _isLoading ? 'নিবন্ধন হচ্ছে...' : 'নিবন্ধন সম্পন্ন করুন',
                        icon: Icons.person_add_alt_1_rounded,
                        isLoading: _isLoading,
                        onPressed: _isLoading ? null : _submitRegistration,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'ইতিমধ্যে একাউন্ট আছে? ',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text(
                        'লগইন করুন',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: AppColors.corporateNavy,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
