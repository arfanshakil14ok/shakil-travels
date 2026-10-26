import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/errors/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/security/secure_storage.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_logo.dart';
import '../../admin/presentation/screens/admin_main_navigation_screen.dart';
import 'package:shakil_travels/features/auth/data/auth_repository.dart';
import 'package:shakil_travels/features/auth/data/session_model.dart';
import '../../candidate/presentation/screens/candidate_main_navigation_screen.dart';
import '../../home/presentation/home_screen.dart';
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

      if (session != null) {
        _navigateToDashboard(session);
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => const HomeScreen(hasActiveSession: false),
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
      // In case of unexpected non-fatal errors, route to Home
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => const HomeScreen(hasActiveSession: false),
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
    } else {
      destination = CandidateMainNavigationScreen(session: session);
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
      backgroundColor: AppColors.deepNavy,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const AppLogo(size: 80, lightVariant: true),
                  const SizedBox(height: 36),
                  if (_isChecking) ...[
                    const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          AppColors.corporatePink,
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'নিরাপদ সেশন যাচাই করা হচ্ছে...',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.corporatePink,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                  if (_networkErrorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceWhite.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.corporatePink.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Column(
                        children: [
                          const Icon(
                            Icons.wifi_off_rounded,
                            color: AppColors.corporatePink,
                            size: 32,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            _networkErrorMessage!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.surfaceWhite,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 16),
                          AppButton(
                            text: 'পুনরায় চেষ্টা করুন (Retry)',
                            variant: AppButtonVariant.secondary,
                            icon: Icons.refresh_rounded,
                            onPressed: _initializeAndCheckSession,
                          ),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () {
                              Navigator.of(context).pushReplacement(
                                MaterialPageRoute(
                                  builder: (_) =>
                                      const HomeScreen(hasActiveSession: false),
                                ),
                              );
                            },
                            child: const Text(
                              'হোমপেজে এগিয়ে যান (Continue to Home)',
                              style: TextStyle(
                                color: AppColors.corporatePink,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
