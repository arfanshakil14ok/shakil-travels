import 'dart:io';

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

  // Auto-detect Android Emulator loopback if no custom URL was explicitly configured
  if (savedUrl == null || savedUrl.isEmpty) {
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
      // Physical device will fallback to LAN IP
    }
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
