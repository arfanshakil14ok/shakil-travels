import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/errors/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/security/biometric_auth_service.dart';
import '../../../core/security/secure_storage.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_logo.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../data/auth_repository.dart';
import '../../candidate/presentation/screens/candidate_main_navigation_screen.dart';
import 'candidate_register_screen.dart';

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
  bool _canUseBiometrics = false;

  late final AuthRepository _authRepository;
  final _biometricService = BiometricAuthService();

  @override
  void initState() {
    super.initState();
    _authRepository = widget.authRepository ??
        AuthRepository(
          apiClient: ApiClient(),
          secureStorage: SecureStorageService(),
        );
    _checkBiometrics();
  }

  Future<void> _checkBiometrics() async {
    try {
      final available = await _biometricService.isBiometricAvailable();
      final hasToken =
          (await _authRepository.secureStorage.getAuthToken()) != null;
      if (mounted) {
        setState(() {
          _canUseBiometrics = available && hasToken;
        });
      }
    } catch (_) {}
  }

  Future<void> _handleBiometricLogin() async {
    final authenticated = await _biometricService.authenticate(
      localizedReason: 'শাকিল ট্রাভেলস পোর্টালে সরাসরি প্রবেশ করতে ফিঙ্গারপ্রিন্ট দিন',
    );
    if (!authenticated) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final session = await _authRepository.restoreSession();
      if (session != null && mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(
            builder: (_) => CandidateMainNavigationScreen(session: session),
          ),
          (route) => false,
        );
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'পূর্ববর্তী সেশন পাওয়া যায়নি। পাসওয়ার্ড দিয়ে লগইন করুন।';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'বায়োমেট্রিক লগইন ব্যর্থ হয়েছে: $e';
        });
      }
    }
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
        setState(() {
          _isLoading = false;
        });
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
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      AppTextField(
                        controller: _identifierController,
                        label: 'মোবাইল নম্বর / আবেদন আইডি / ইমেইল',
                        hint: '017XXXXXXXX বা CAND-XXXXX',
                        prefixIcon: Icons.badge_outlined,
                        keyboardType: TextInputType.text,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'মোবাইল নম্বর বা আবেদন আইডি লিখুন';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        controller: _passwordController,
                        label: 'পাসওয়ার্ড (Password)',
                        hint: 'আপনার পাসওয়ার্ড লিখুন',
                        prefixIcon: Icons.lock_outline_rounded,
                        obscureText: _obscurePassword,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_off_rounded
                                : Icons.visibility_rounded,
                            size: 20,
                            color: AppColors.textSecondary,
                          ),
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'পাসওয়ার্ড আবশ্যক';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 8),

                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: _showForgotPasswordNotice,
                          style: TextButton.styleFrom(
                            visualDensity: VisualDensity.compact,
                            padding: EdgeInsets.zero,
                          ),
                          child: const Text(
                            'পাসওয়ার্ড ভুলে গেছেন?',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.corporateNavy,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      AppButton(
                        text: 'লগইন করুন (Sign In)',
                        isLoading: _isLoading,
                        icon: Icons.login_rounded,
                        onPressed: _isLoading ? null : _submitLogin,
                      ),

                      if (_canUseBiometrics) ...[
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          icon: const Icon(
                            Icons.fingerprint_rounded,
                            color: AppColors.corporateNavy,
                          ),
                          label: const Text(
                            'ফিঙ্গারপ্রিন্ট দিয়ে প্রবেশ করুন',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: AppColors.corporateNavy,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            side: const BorderSide(color: AppColors.corporateNavy),
                          ),
                          onPressed: _isLoading ? null : _handleBiometricLogin,
                        ),
                      ],
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
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => CandidateRegisterScreen(
                              authRepository: _authRepository,
                            ),
                          ),
                        );
                      },
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
}
