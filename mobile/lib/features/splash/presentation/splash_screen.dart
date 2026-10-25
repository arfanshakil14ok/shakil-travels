import 'package:flutter/material.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/security/secure_storage.dart';
import '../../../shared/widgets/app_logo.dart';
import '../../auth/data/auth_repository.dart';
import '../../home/presentation/home_screen.dart';

class SplashScreen extends StatefulWidget {
  final AuthRepository? authRepository;

  const SplashScreen({super.key, this.authRepository});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _fadeAnimation = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _controller.forward();

    _navigateNext();
  }

  Future<void> _navigateNext() async {
    await Future.delayed(const Duration(milliseconds: 1600));
    if (!mounted) return;

    final storage = SecureStorageService();
    final hasSession = await storage.hasValidSession();

    if (!mounted) return;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => HomeScreen(hasActiveSession: hasSession),
      ),
    );
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
      body: Center(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              AppLogo(size: 80, lightVariant: true),
              SizedBox(height: 36),
              SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.corporatePink),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
