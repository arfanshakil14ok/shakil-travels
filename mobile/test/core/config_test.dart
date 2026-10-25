import 'package:flutter_test/flutter_test.dart';
import 'package:shakil_travels/core/config/app_config.dart';
import 'package:shakil_travels/core/config/environment.dart';

void main() {
  group('AppConfig Tests', () {
    test('Official branding constants are accurate', () {
      expect(AppConfig.appName, equals('SHAKIL TRAVELS'));
      expect(AppConfig.appDisplayName, equals('SHAKIL TRAVELS'));
      expect(AppConfig.packageName, equals('com.shakiltravels.app'));
      expect(AppConfig.recruitingLicense, equals('RL-1892'));
      expect(AppConfig.helplinePhone, equals('+8801913681771'));
    });

    test('Android Emulator host mode resolves to 10.0.2.2:3000', () {
      const config = AppConfig(
        environment: EnvironmentType.development,
        devHostMode: DevHostMode.androidEmulator,
      );
      expect(config.apiBaseUrl, equals('http://10.0.2.2:3000'));
    });

    test('Physical device host mode resolves to specified LAN IP:3000', () {
      const config = AppConfig(
        environment: EnvironmentType.development,
        devHostMode: DevHostMode.physicalDeviceLan,
        customLanIp: '192.168.1.150',
      );
      expect(config.apiBaseUrl, equals('http://192.168.1.150:3000'));
    });

    test('Production environment uses HTTPS', () {
      const config = AppConfig(
        environment: EnvironmentType.production,
        productionBaseUrl: 'https://erp.shakiltravels.com',
      );
      expect(config.apiBaseUrl, startsWith('https://'));
      expect(config.apiBaseUrl, equals('https://erp.shakiltravels.com'));
    });
  });
}
