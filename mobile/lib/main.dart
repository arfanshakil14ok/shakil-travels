import 'dart:io';

import 'package:flutter/foundation.dart';
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

  // Auto-detect environment
  const EnvironmentType env =
      kReleaseMode ? EnvironmentType.production : EnvironmentType.development;

  // Auto-detect Android Emulator loopback if no custom URL was explicitly configured and in dev mode
  if ((savedUrl == null || savedUrl.isEmpty) && !kReleaseMode) {
    try {
      final socket = await Socket.connect(
        '10.0.2.2',
        3000,
        timeout: const Duration(milliseconds: 350),
      );
      await socket.close();
      savedUrl = 'http://10.0.2.2:3000';
      SafeLogger.info('Detected Android Emulator: Auto-routed API to $savedUrl');
    } catch (_) {
      // Physical device fallback
    }
  }

  // In release mode without a custom URL, default to live cloud ERP: https://shakil-travels.vercel.app
  if ((savedUrl == null || savedUrl.isEmpty) && kReleaseMode) {
    savedUrl = 'https://shakil-travels.vercel.app';
  }

  AppConfig.initialize(
    AppConfig(
      environment: env,
      devHostMode: DevHostMode.physicalDeviceLan,
      customLanIp: '192.168.0.127',
      productionBaseUrl: 'https://shakil-travels.vercel.app',
      customApiBaseUrl: savedUrl,
    ),
  );

  SafeLogger.info(
    'Initializing ${AppConfig.appName} (v${AppConfig.appVersion})',
  );
  SafeLogger.info('Target Backend URL: ${AppConfig.current.apiBaseUrl}');

  runApp(const ShakilTravelsApp());
}
