import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app/app.dart';
import 'core/config/app_config.dart';
import 'core/config/environment.dart';
import 'core/network/safe_logger.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Retrieve any user-configured server URL from local storage
  String? savedUrl;
  try {
    final prefs = await SharedPreferences.getInstance();
    savedUrl = prefs.getString('custom_server_url');
  } catch (e) {
    SafeLogger.warn('Could not read SharedPreferences: $e');
  }

  // Configure environment:
  // Defaults to Physical Device LAN (192.168.0.127:3000) for real phone testing
  AppConfig.initialize(
    AppConfig(
      environment: EnvironmentType.development,
      devHostMode: DevHostMode.physicalDeviceLan,
      customLanIp: '192.168.0.127',
      customApiBaseUrl: savedUrl,
    ),
  );

  SafeLogger.info(
    'Initializing ${AppConfig.appName} (v${AppConfig.appVersion})',
  );
  SafeLogger.info('Target Backend URL: ${AppConfig.current.apiBaseUrl}');

  runApp(const ShakilTravelsApp());
}
