import 'environment.dart';

/// Centralized configuration for SHAKIL TRAVELS Android Application.
/// Ensures all networking, environment parameters, and branding metadata
/// are strictly controlled and never hardcode sensitive secrets.
class AppConfig {
  final EnvironmentType environment;
  final DevHostMode devHostMode;
  final String? customLanIp;
  final String? productionBaseUrl;
  final String? customApiBaseUrl;

  const AppConfig({
    this.environment = EnvironmentType.development,
    this.devHostMode = DevHostMode.physicalDeviceLan,
    this.customLanIp = '192.168.0.127',
    this.productionBaseUrl,
    this.customApiBaseUrl,
  });

  // Official Branding Constants
  static const String appName = 'SHAKIL TRAVELS';
  static const String appDisplayName = 'SHAKIL TRAVELS';
  static const String packageName = 'com.shakiltravels.app';
  static const String recruitingLicense = 'RL-2579';
  static const String helplinePhone = '+8801913681771';
  static const String helplineDisplay = '+880 1913-681771';
  static const String appVersion = '1.0.0';
  static const int appBuildNumber = 1;

  // Network Timeout Configurations
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);

  /// Computes the backend API base URL based on active environment and host mode.
  ///
  /// - Android Emulator: 10.0.2.2 points to host machine localhost:3000
  /// - Physical Device: Requires host computer's local Wi-Fi IP (e.g. 192.168.1.105:3000)
  /// - Production: Enforces HTTPS URL
  String get apiBaseUrl {
    if (customApiBaseUrl != null && customApiBaseUrl!.trim().isNotEmpty) {
      return customApiBaseUrl!.trim();
    }
    switch (environment) {
      case EnvironmentType.production:
        final url = productionBaseUrl ?? 'https://shakiltravels.com';
        assert(
          url.startsWith('https://'),
          'SECURITY WARNING: Production API URL must use HTTPS.',
        );
        return url;

      case EnvironmentType.staging:
        return 'https://staging.shakiltravels.com';

      case EnvironmentType.development:
        switch (devHostMode) {
          case DevHostMode.androidEmulator:
            // 10.0.2.2 is Android Emulator's default gateway to the host machine loopback
            return 'http://10.0.2.2:3000';

          case DevHostMode.physicalDeviceLan:
            final lanIp = customLanIp ?? '192.168.0.127';
            return 'http://$lanIp:3000';

          case DevHostMode.custom:
            return customLanIp ?? 'http://192.168.0.127:3000';
        }
    }
  }

  /// Singleton active configuration instance
  static AppConfig _current = const AppConfig();

  static AppConfig get current => _current;

  /// Global static accessor for current API base URL
  static String get baseUrl => _current.apiBaseUrl;

  static void initialize(AppConfig config) {
    _current = config;
  }

  static void updateApiBaseUrl(String url) {
    _current = AppConfig(
      environment: _current.environment,
      devHostMode: _current.devHostMode,
      customLanIp: _current.customLanIp,
      productionBaseUrl: _current.productionBaseUrl,
      customApiBaseUrl: url,
    );
  }
}
