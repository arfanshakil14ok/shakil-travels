import 'package:flutter/material.dart';
import 'app/app.dart';
import 'core/config/app_config.dart';
import 'core/config/environment.dart';
import 'core/network/safe_logger.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Configure environment for local development testing
  // Default: Android Emulator loopback mapping to localhost:3000
  AppConfig.initialize(
    const AppConfig(
      environment: EnvironmentType.development,
      devHostMode: DevHostMode.androidEmulator,
    ),
  );

  SafeLogger.info('Initializing ${AppConfig.appName} (v${AppConfig.appVersion})');
  SafeLogger.info('Target Backend URL: ${AppConfig.current.apiBaseUrl}');

  runApp(const ShakilTravelsApp());
}
