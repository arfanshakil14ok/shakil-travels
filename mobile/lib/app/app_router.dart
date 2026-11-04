import 'package:flutter/material.dart';

import '../features/admin/presentation/screens/admin_main_navigation_screen.dart';
import '../features/auth/data/session_model.dart';
import '../features/auth/presentation/candidate_register_screen.dart';
import '../features/auth/presentation/unified_login_screen.dart';
import '../features/candidate/presentation/screens/candidate_main_navigation_screen.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/splash/presentation/splash_screen.dart';
import '../features/staff/presentation/screens/qr_verification_screen.dart';
import '../features/staff/presentation/screens/staff_main_navigation_screen.dart';

class AppRouter {
  static const String splash = '/';
  static const String login = '/login';
  static const String home = '/home';
  static const String roleSelect = '/role-select';
  static const String candidateLogin = '/candidate-login';
  static const String candidateRegister = '/candidate-register';
  static const String staffLogin = '/staff-login';
  static const String adminLogin = '/admin-login';
  static const String candidateDashboard = '/candidate-dashboard';
  static const String staffDashboard = '/staff-dashboard';
  static const String adminDashboard = '/admin-dashboard';
  static const String qrVerification = '/qr-verification';

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return MaterialPageRoute(builder: (_) => const SplashScreen());
      case login:
        return MaterialPageRoute(builder: (_) => const UnifiedLoginScreen());
      case home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      case roleSelect:
        // Transitioned to unified login in Phase 6.1
        return MaterialPageRoute(builder: (_) => const UnifiedLoginScreen());
      case candidateLogin:
        // Maintained for backward compatibility, directs to unified screen
        return MaterialPageRoute(builder: (_) => const UnifiedLoginScreen());
      case candidateRegister:
        return MaterialPageRoute(
          builder: (_) => const CandidateRegisterScreen(),
        );
      case qrVerification:
        final query = settings.arguments as String?;
        return MaterialPageRoute(
          builder: (_) => QrVerificationScreen(initialQuery: query),
        );
      case staffLogin:
        // Maintained for backward compatibility, directs to unified screen
        return MaterialPageRoute(builder: (_) => const UnifiedLoginScreen());
      case adminLogin:
        // Maintained for backward compatibility, directs to unified screen
        return MaterialPageRoute(builder: (_) => const UnifiedLoginScreen());
      case candidateDashboard:
        final session = settings.arguments as SessionModel?;
        if (session == null || !session.isCandidate) {
          return MaterialPageRoute(builder: (_) => const UnifiedLoginScreen());
        }
        return MaterialPageRoute(
          builder: (_) => CandidateMainNavigationScreen(session: session),
        );
      case staffDashboard:
        final session = settings.arguments as SessionModel?;
        if (session == null || !session.isStaff) {
          return MaterialPageRoute(builder: (_) => const UnifiedLoginScreen());
        }
        return MaterialPageRoute(
          builder: (_) => StaffMainNavigationScreen(session: session),
        );
      case adminDashboard:
        final session = settings.arguments as SessionModel?;
        if (session == null || !session.isAdmin) {
          return MaterialPageRoute(builder: (_) => const UnifiedLoginScreen());
        }
        return MaterialPageRoute(
          builder: (_) => AdminMainNavigationScreen(session: session),
        );
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(child: Text('No route defined for ${settings.name}')),
          ),
        );
    }
  }
}
