import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/errors/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/security/biometric_auth_service.dart';
import '../../../core/security/secure_storage.dart';
import '../../../core/utils/support_launcher.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_logo.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../admin/presentation/screens/admin_main_navigation_screen.dart';
import '../../candidate/presentation/screens/candidate_main_navigation_screen.dart';
import '../../home/presentation/home_screen.dart';
import '../../staff/presentation/screens/staff_main_navigation_screen.dart';
import '../data/auth_repository.dart';
import '../data/session_model.dart';
import 'candidate_register_screen.dart';
import 'server_config_dialog.dart';

/// Single unified login screen for Candidate, Staff, and Admin users.
/// Eliminates upfront role selection: the backend verifies credentials,
/// determines identity, and the client routes automatically to the role dashboard.
class UnifiedLoginScreen extends StatefulWidget {
  final AuthRepository? authRepository;
  final BiometricAuthService? biometricAuth;
  final bool embeddedInTab;

  const UnifiedLoginScreen({
    super.key,
    this.authRepository,
    this.biometricAuth,
    this.embeddedInTab = false,
  });

  @override
  State<UnifiedLoginScreen> createState() => _UnifiedLoginScreenState();
}

class _UnifiedLoginScreenState extends State<UnifiedLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();

  late final AuthRepository _authRepository;
  late final BiometricAuthService _biometricAuth;

  bool _isPasswordObscured = true;
  bool _isLoading = false;
  bool _isBiometricAvailable = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _authRepository = widget.authRepository ??
        AuthRepository(
          apiClient: ApiClient(),
          secureStorage: SecureStorageService(),
        );
    _biometricAuth = widget.biometricAuth ?? BiometricAuthService();

    _checkBiometrics();
  }

  Future<void> _checkBiometrics() async {
    final available = await _biometricAuth.isBiometricAvailable();
    if (mounted) {
      setState(() => _isBiometricAvailable = available);
    }
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final session = await _authRepository.loginUnified(
        identifier: _identifierController.text.trim(),
        password: _passwordController.text,
      );

      if (!mounted) return;
      _navigateToRoleDashboard(session);
    } on NetworkException catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.message);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.message);
    } catch (e) {
      if (!mounted) return;
      setState(
        () => _errorMessage = 'লগইন প্রক্রিয়া ব্যর্থ হয়েছে: $e',
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleBiometricLogin() async {
    setState(() => _errorMessage = null);

    try {
      final authenticated = await _biometricAuth.authenticate(
        localizedReason:
            'শাকিল ট্রাভেলস ইআরপিতে দ্রুত লগইন করতে বায়োমেট্রিক স্ক্যান করুন',
      );

      if (!authenticated || !mounted) return;

      setState(() => _isLoading = true);

      final session = await _authRepository.restoreSession();

      if (!mounted) return;

      if (session != null && session.isValidRole) {
        _navigateToRoleDashboard(session);
      } else {
        setState(() {
          _errorMessage =
              'বায়োমেট্রিক লগইন ব্যবহারের পূর্বে অন্তত একবার আপনার ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করুন।';
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = 'বায়োমেট্রিক যাচাইকরণ ব্যর্থ হয়েছে: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _navigateToRoleDashboard(SessionModel session) {
    Widget destination;

    if (session.isAdmin) {
      destination = AdminMainNavigationScreen(session: session);
    } else if (session.isStaff) {
      destination = StaffMainNavigationScreen(session: session);
    } else if (session.isCandidate) {
      destination = CandidateMainNavigationScreen(session: session);
    } else {
      setState(() {
        _errorMessage =
            'অননুমোদিত পদবী (${session.role})। অনুগ্রহ করে অফিসে যোগাযোগ করুন।';
      });
      return;
    }

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => destination),
      (route) => false,
    );
  }

  void _showHelpDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'লগইন সহায়তা ও হেল্পলাইন',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.corporateNavy,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'পাসওয়ার্ড ভুলে গেলে বা লগইন সমস্যায় আমাদের অফিস হেল্পলাইনে সরাসরি যোগাযোগ করুন।',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.corporateNavy.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.phone_in_talk_rounded,
                  color: AppColors.corporateNavy,
                ),
              ),
              title: const Text('হটলাইন হেল্পলাইন'),
              subtitle: const Text('+880 1913-681771'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
              onTap: () {
                Navigator.pop(ctx);
                SupportLauncher.callHelpline(context: context);
              },
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.chat_bubble_outline_rounded,
                  color: Colors.green,
                ),
              ),
              title: const Text('হোয়াটসঅ্যাপ সাপোর্ট'),
              subtitle: const Text('+880 1913-681771'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
              onTap: () {
                Navigator.pop(ctx);
                SupportLauncher.openWhatsApp(context: context);
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: widget.embeddedInTab
          ? null
          : AppBar(
              backgroundColor: AppColors.corporateNavy,
              elevation: 0,
              title: const Text(
                'SHAKILWORK ERP',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                  color: AppColors.surfaceWhite,
                ),
              ),
              centerTitle: true,
              actions: [
                IconButton(
                  tooltip: 'পাবলিক হোম দেখুন',
                  icon: const Icon(Icons.home_outlined, color: Colors.white),
                  onPressed: () {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                        builder: (_) =>
                            const HomeScreen(hasActiveSession: false),
                      ),
                    );
                  },
                ),
                IconButton(
                  tooltip: 'সার্ভার কনফিগারেশন',
                  icon: const Icon(Icons.dns_outlined, color: Colors.white70),
                  onPressed: () => ServerConfigDialog.show(context),
                ),
              ],
            ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Hero Brand Header
              Container(
                padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.corporateNavy, AppColors.deepNavy],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.corporateNavy.withValues(alpha: 0.15),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    const AppLogo(size: 60, lightVariant: true),
                    const SizedBox(height: 12),
                    const Text(
                      'শাকিল ট্রাভেলস ইআরপি',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.surfaceWhite,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'SHAKILWORK Unified Enterprise Portal',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppColors.corporatePink,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.corporatePink.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: AppColors.corporatePink.withValues(alpha: 0.5),
                          width: 1,
                        ),
                      ),
                      child: const Text(
                        'GOVT APPROVED RL-2579',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppColors.surfaceWhite,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Main Form Card
              AppCard(
                padding: const EdgeInsets.all(20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
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
                              Icons.lock_person_rounded,
                              color: AppColors.corporateNavy,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'প্রবেশ করুন (Sign In)',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.corporateNavy,
                                ),
                              ),
                              Text(
                                'প্রার্থী, স্টাফ এবং অ্যাডমিনের জন্য একক পোর্টাল',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // Error Banner
                      if (_errorMessage != null) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.errorLight,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: AppColors.error.withValues(alpha: 0.4),
                            ),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(
                                Icons.error_outline_rounded,
                                color: AppColors.error,
                                size: 18,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.error,
                                    height: 1.3,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Identifier Field (Phone / Applicant ID / Email)
                      AppTextField(
                        controller: _identifierController,
                        label: 'ইউজার আইডি / মোবাইল / ইমেইল',
                        hint: 'মোবাইল নম্বর, আবেদন আইডি বা অফিশিয়াল ইমেইল',
                        prefixIcon: Icons.badge_outlined,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        enabled: !_isLoading,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'মোবাইল নম্বর, আবেদন আইডি বা ইমেইল লিখুন';
                          }
                          if (value.trim().length < 3) {
                            return 'কমপক্ষে ৩টি অক্ষর বা সংখ্যা দিন';
                          }
                          return null;
                        },
                      ),

                      const SizedBox(height: 14),

                      // Password Field
                      AppTextField(
                        controller: _passwordController,
                        label: 'পাসওয়ার্ড (Password)',
                        hint: 'আপনার একাউন্টের পাসওয়ার্ড',
                        prefixIcon: Icons.lock_outline_rounded,
                        obscureText: _isPasswordObscured,
                        textInputAction: TextInputAction.done,
                        enabled: !_isLoading,
                        onFieldSubmitted: (_) => _handleLogin(),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _isPasswordObscured
                                ? Icons.visibility_off_rounded
                                : Icons.visibility_rounded,
                            color: AppColors.textSecondary,
                            size: 20,
                          ),
                          onPressed: () {
                            setState(
                              () => _isPasswordObscured = !_isPasswordObscured,
                            );
                          },
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'পাসওয়ার্ড আবশ্যক';
                          }
                          if (value.length < 4) {
                            return 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে';
                          }
                          return null;
                        },
                      ),

                      const SizedBox(height: 10),

                      // Forgot Password / Help Trigger
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: _showHelpDialog,
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text(
                            'লগইন করতে সমস্যা হচ্ছে? সহায়তা নিন',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.corporateNavy,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Login Actions (Primary Sign In + Biometrics)
                      Row(
                        children: [
                          Expanded(
                            child: AppButton(
                              text: 'লগইন করুন (Sign In)',
                              icon: Icons.login_rounded,
                              isLoading: _isLoading,
                              onPressed: _isLoading ? null : _handleLogin,
                            ),
                          ),
                          if (_isBiometricAvailable) ...[
                            const SizedBox(width: 10),
                            InkWell(
                              onTap: _isLoading ? null : _handleBiometricLogin,
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                height: 48,
                                width: 48,
                                decoration: BoxDecoration(
                                  color: AppColors.corporatePink.withValues(
                                    alpha: 0.15,
                                  ),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: AppColors.corporatePink,
                                    width: 1.5,
                                  ),
                                ),
                                child: const Icon(
                                  Icons.fingerprint_rounded,
                                  color: AppColors.corporateNavy,
                                  size: 26,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Registration Section
                      Row(
                        children: [
                          Expanded(
                            child: Divider(
                              color: Colors.grey.shade300,
                              thickness: 1,
                            ),
                          ),
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 10),
                            child: Text(
                              'নতুন ব্যবহারকারী?',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          Expanded(
                            child: Divider(
                              color: Colors.grey.shade300,
                              thickness: 1,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 14),

                      // Register Button
                      AppButton(
                        text: 'নতুন প্রার্থী? নিবন্ধন করুন (New Candidate?)',
                        icon: Icons.person_add_alt_1_rounded,
                        variant: AppButtonVariant.outline,
                        onPressed: _isLoading
                            ? null
                            : () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) =>
                                        const CandidateRegisterScreen(),
                                  ),
                                );
                              },
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // Bottom Public Services Quick Link
              Center(
                child: TextButton.icon(
                  onPressed: () {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                        builder: (_) =>
                            const HomeScreen(hasActiveSession: false),
                      ),
                    );
                  },
                  icon: const Icon(
                    Icons.travel_explore_rounded,
                    size: 16,
                    color: AppColors.corporateNavy,
                  ),
                  label: const Text(
                    'লগইন ছাড়া চাকরির খবর ও ভিসা ট্র্যাকিং দেখুন',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.corporateNavy,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Footer Branding
              const Center(
                child: Text(
                  'SHAKIL TRAVELS ERP • RL-2579\nOne System • One Database • Dual Client Platforms',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.textMuted,
                    height: 1.4,
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}
