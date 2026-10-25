import 'package:flutter/material.dart';
import '../features/auth/presentation/role_selection_screen.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/profile/presentation/profile_placeholder_screen.dart';
import '../features/splash/presentation/splash_screen.dart';

class AppRouter {
  static const String splash = '/';
  static const String home = '/home';
  static const String roleSelect = '/role-select';
  static const String profile = '/profile';

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return MaterialPageRoute(builder: (_) => const SplashScreen());
      case home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      case roleSelect:
        return MaterialPageRoute(builder: (_) => const RoleSelectionScreen());
      case profile:
        return MaterialPageRoute(builder: (_) => const ProfilePlaceholderScreen());
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(
              child: Text('No route defined for ${settings.name}'),
            ),
          ),
        );
    }
  }
}
