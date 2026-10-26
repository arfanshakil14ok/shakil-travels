import 'package:flutter/material.dart';

import '../features/admin/presentation/screens/admin_main_navigation_screen.dart';
import '../features/auth/data/session_model.dart';
import '../features/auth/presentation/admin_login_screen.dart';
import '../features/auth/presentation/candidate_login_screen.dart';
import '../features/auth/presentation/role_selection_screen.dart';
import '../features/auth/presentation/staff_login_screen.dart';
import '../features/candidate/presentation/screens/candidate_main_navigation_screen.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/splash/presentation/splash_screen.dart';
import '../features/staff/presentation/screens/staff_main_navigation_screen.dart';

class AppRouter {
  static const String splash = '/';
  static const String home = '/home';
  static const String roleSelect = '/role-select';
  static const String candidateLogin = '/candidate-login';
  static const String staffLogin = '/staff-login';
  static const String adminLogin = '/admin-login';
  static const String candidateDashboard = '/candidate-dashboard';
  static const String staffDashboard = '/staff-dashboard';
  static const String adminDashboard = '/admin-dashboard';

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return MaterialPageRoute(builder: (_) => const SplashScreen());
      case home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      case roleSelect:
        return MaterialPageRoute(builder: (_) => const RoleSelectionScreen());
      case candidateLogin:
        return MaterialPageRoute(builder: (_) => const CandidateLoginScreen());
      case staffLogin:
        return MaterialPageRoute(builder: (_) => const StaffLoginScreen());
      case adminLogin:
        return MaterialPageRoute(builder: (_) => const AdminLoginScreen());
      case candidateDashboard:
        final session = settings.arguments as SessionModel?;
        if (session == null || !session.isCandidate) {
          return MaterialPageRoute(
            builder: (_) => const CandidateLoginScreen(),
          );
        }
        return MaterialPageRoute(
          builder: (_) => CandidateMainNavigationScreen(session: session),
        );
      case staffDashboard:
        final session = settings.arguments as SessionModel?;
        if (session == null || !session.isStaff) {
          return MaterialPageRoute(builder: (_) => const StaffLoginScreen());
        }
        return MaterialPageRoute(
          builder: (_) => StaffMainNavigationScreen(session: session),
        );
      case adminDashboard:
        final session = settings.arguments as SessionModel?;
        if (session == null || !session.isAdmin) {
          return MaterialPageRoute(builder: (_) => const AdminLoginScreen());
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
