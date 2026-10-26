import 'package:flutter/material.dart';

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

class CandidateLoginScreen extends StatefulWidget {
  final AuthRepository? authRepository;

  const CandidateLoginScreen({super.key, this.authRepository});

  @override
  State<CandidateLoginScreen> createState() => _CandidateLoginScreenState();
}

class _CandidateLoginScreenState extends State<CandidateLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;

  late final AuthRepository _authRepository;

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
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submitLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final session = await _authRepository.loginCandidate(
        identifier: _identifierController.text,
        password: _passwordController.text,
      );

      if (!mounted) return;

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (_) => CandidateMainNavigationScreen(session: session),
        ),
        (route) => false,
      );
    } on RateLimitException catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.message;
      });
    } on UnauthorizedException catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.message.isNotEmpty
            ? e.message
            : 'ভুল তথ্য দিয়েছেন। মোবাইল নম্বর ও পাসওয়ার্ড পুনরায় যাচাই করুন।';
      });
    } on ForbiddenException catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.message;
      });
    } on NetworkException catch (_) {
      if (!mounted) return;
      setState(() {
        _errorMessage =
            'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। আপনার ইন্টারনেট চেক করুন।';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e
            .toString()
            .replaceFirst('Exception: ', '')
            .replaceFirst('ApiException: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(title: const Text('Candidate Login / প্রার্থী লগইন')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 10),
                const Center(child: AppLogo(size: 60)),
                const SizedBox(height: 16),
                const Text(
                  'প্রার্থী ও অভিবাসী কর্মী পোর্টাল',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.corporateNavy,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'আপনার আবেদন অগ্রগতি, ভিসা স্ট্যাটাস ও ডকুমেন্ট দেখতে লগইন করুন।',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 24),

                // Error Banner
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.errorLight,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: AppColors.error.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.error_outline_rounded,
                          color: AppColors.error,
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(
                              color: AppColors.error,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Input Card
                AppCard(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      AppTextField(
                        controller: _identifierController,
                        label: 'মোবাইল নম্বর / আবেদন আইডি / ইমেইল',
                        hint: '01XXXXXXXXX বা SGR-2026-XXXXXX',
                        prefixIcon: Icons.account_circle_outlined,
                        keyboardType: TextInputType.text,
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'মোবাইল নম্বর বা আবেদন আইডি লিখুন';
                          }
                          if (val.trim().length < 3) {
                            return 'সঠিক তথ্য লিখুন';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        controller: _passwordController,
                        label: 'পাসওয়ার্ড (Password)',
                        hint: 'আপনার পাসওয়ার্ড দিন',
                        prefixIcon: Icons.lock_outline_rounded,
                        obscureText: _obscurePassword,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_off_rounded
                                : Icons.visibility_rounded,
                            color: AppColors.textSecondary,
                            size: 20,
                          ),
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                        ),
                        validator: (val) {
                          if (val == null || val.isEmpty) {
                            return 'পাসওয়ার্ড আবশ্যক';
                          }
                          return null;
                        },
                        onFieldSubmitted: (_) => _submitLogin(),
                      ),
                      const SizedBox(height: 12),

                      // Forgot Password Link
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: _showForgotPasswordNotice,
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            minimumSize: const Size(0, 0),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text(
                            'পাসওয়ার্ড ভুলে গেছেন? (Forgot Password)',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.corporateNavy,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Login Button
                      AppButton(
                        text: 'লগইন করুন (Sign In)',
                        isLoading: _isLoading,
                        icon: Icons.login_rounded,
                        onPressed: _isLoading ? null : _submitLogin,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Register Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'নতুন আবেদনকারী? ',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    GestureDetector(
                      onTap: _showRegistrationNotice,
                      child: const Text(
                        'রেজিস্ট্রেশন করুন',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.corporateNavy,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Official Helpline Card
                AppCard(
                  backgroundColor: AppColors.goldLight,
                  border:
                      Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  child: const Row(
                    children: [
                      Icon(
                        Icons.support_agent_rounded,
                        color: AppColors.warning,
                        size: 24,
                      ),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'লগইন করতে কোনো সমস্যা হলে আমাদের হেল্পলাইনে যোগাযোগ করুন: ০১৯১৩-৬৮১৭১',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.deepNavy,
                            height: 1.35,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showForgotPasswordNotice() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'পাসওয়ার্ড পুনরুদ্ধার সহায়তা',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppColors.corporateNavy,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'নিরাপত্তার স্বার্থে পাসওয়ার্ড রিসেট করতে অনুগ্রহ করে শাকিল ট্রাভেলস-এর অফিসিয়াল ডেস্কে যোগাযোগ করুন অথবা আপনার জাতীয় পরিচয়পত্র ও পাসপোর্ট নম্বর সহ হেল্পলাইনে কল করুন।',
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'হটলাইন: +880 1913-681771\nইমেইল: support@shakiltravels.com',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.deepNavy,
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('ঠিক আছে'),
            ),
          ],
        ),
      ),
    );
  }

  void _showRegistrationNotice() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'নতুন প্রার্থী রেজিস্ট্রেশন',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppColors.corporateNavy,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'অনলাইন প্রার্থী নিবন্ধনে পাসপোর্ট সাইজ ছবি ও প্রাথমিক তথ্যাদি আবশ্যক। রেজিস্ট্রেশন উইজার্ডটি মোবাইল অ্যাপের পরবর্তী ফেইজে যুক্ত হবে অথবা আপনি আমাদের ওয়েবসাইট থেকে রেজিস্ট্রেশন করতে পারেন।',
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('বুঝেছি'),
            ),
          ],
        ),
      ),
    );
  }
}
