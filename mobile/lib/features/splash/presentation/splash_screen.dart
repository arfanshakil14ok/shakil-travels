import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/errors/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/security/secure_storage.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_logo.dart';
import '../../admin/presentation/screens/admin_main_navigation_screen.dart';
import '../../auth/presentation/unified_login_screen.dart';
import 'package:shakil_travels/features/auth/data/auth_repository.dart';
import 'package:shakil_travels/features/auth/data/session_model.dart';
import '../../candidate/presentation/screens/candidate_main_navigation_screen.dart';
import '../../staff/presentation/screens/staff_main_navigation_screen.dart';

class SplashScreen extends StatefulWidget {
  final AuthRepository? authRepository;

  const SplashScreen({super.key, this.authRepository});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  late final AuthRepository _authRepository;
  bool _isChecking = true;
  String? _networkErrorMessage;

  @override
  void initState() {
    super.initState();
    _authRepository = widget.authRepository ??
        AuthRepository(
          apiClient: ApiClient(),
          secureStorage: SecureStorageService(),
        );

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _fadeAnimation = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _controller.forward();

    _initializeAndCheckSession();
  }

  Future<void> _initializeAndCheckSession() async {
    setState(() {
      _isChecking = true;
      _networkErrorMessage = null;
    });

    // Provide a smooth splash pause
    await Future.delayed(const Duration(milliseconds: 1200));
    if (!mounted) return;

    try {
      final session = await _authRepository.restoreSession();

      if (!mounted) return;

      if (session != null && session.isValidRole) {
        _navigateToDashboard(session);
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => const UnifiedLoginScreen(),
          ),
        );
      }
    } on NetworkException catch (_) {
      if (!mounted) return;
      setState(() {
        _isChecking = false;
        _networkErrorMessage =
            'সার্ভারের সাথে সংযোগ পাওয়া যায়নি।\nআপনার ইন্টারনেট চেক করে পুনরায় চেষ্টা করুন।';
      });
    } catch (e) {
      if (!mounted) return;
      // In case of unexpected non-fatal errors, route to UnifiedLoginScreen
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => const UnifiedLoginScreen(),
        ),
      );
    }
  }

  void _navigateToDashboard(SessionModel session) {
    Widget destination;
    if (session.isAdmin) {
      destination = AdminMainNavigationScreen(session: session);
    } else if (session.isStaff) {
      destination = StaffMainNavigationScreen(session: session);
    } else if (session.isCandidate) {
      destination = CandidateMainNavigationScreen(session: session);
    } else {
      destination = const UnifiedLoginScreen();
    }

    Navigator.of(context)
        .pushReplacement(MaterialPageRoute(builder: (_) => destination));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.corporateNavy,
      body: SafeArea(
        child: Center(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Spacer(flex: 2),

                  // Brand Mark
                  const AppLogo(size: 96, lightVariant: true),

                  const SizedBox(height: 24),

                  // Company Title
                  const Text(
                    'SHAKIL TRAVELS',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.0,
                      color: AppColors.surfaceWhite,
                    ),
                  ),

                  const SizedBox(height: 6),

                  // Official License Tag
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.corporatePink.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppColors.corporatePink.withValues(alpha: 0.6),
                        width: 1,
                      ),
                    ),
                    child: const Text(
                      'GOVT. APPROVED RECRUITING AGENCY • RL-2579',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                        color: AppColors.corporatePink,
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // System Title
                  const Text(
                    'SHAKILWORK ERP',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.surfaceWhite,
                      letterSpacing: 1.2,
                    ),
                  ),

                  const Spacer(flex: 2),

                  // Status Indicator or Error Action
                  if (_isChecking) ...[
                    const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          AppColors.corporatePink,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'সিস্টেম লোড হচ্ছে...',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.surfaceWhite.withValues(alpha: 0.7),
                      ),
                    ),
                  ] else if (_networkErrorMessage != null) ...[
                    Text(
                      _networkErrorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.corporatePink,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 16),
                    AppButton(
                      text: 'পুনরায় চেষ্টা করুন (Retry)',
                      variant: AppButtonVariant.secondary,
                      onPressed: _initializeAndCheckSession,
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(
                            builder: (_) => const UnifiedLoginScreen(),
                          ),
                        );
                      },
                      child: const Text(
                        'অফলাইন লগইনে যান (Go to Login)',
                        style: TextStyle(
                          color: AppColors.surfaceWhite,
                          fontSize: 12,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ],

                  const Spacer(flex: 1),

                  // Footer Copyright
                  Text(
                    '© 2026 SHAKIL TRAVELS • Native ERP',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.surfaceWhite.withValues(alpha: 0.5),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
