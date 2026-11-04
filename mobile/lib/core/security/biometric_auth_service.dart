import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import '../network/safe_logger.dart';

class BiometricAuthService {
  final LocalAuthentication _auth;

  BiometricAuthService({LocalAuthentication? auth})
      : _auth = auth ?? LocalAuthentication();

  /// Checks if device has biometric hardware and is enrolled
  Future<bool> isBiometricAvailable() async {
    try {
      final canAuthenticateWithBiometrics = await _auth.canCheckBiometrics;
      final canAuthenticate =
          canAuthenticateWithBiometrics || await _auth.isDeviceSupported();
      return canAuthenticate;
    } on PlatformException catch (e) {
      SafeLogger.warn('Biometric availability check failed: $e');
      return false;
    }
  }

  /// Lists available biometric types (fingerprint, face, iris)
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _auth.getAvailableBiometrics();
    } on PlatformException catch (e) {
      SafeLogger.warn('Get biometrics failed: $e');
      return [];
    }
  }

  /// Prompts user to authenticate with fingerprint or face
  Future<bool> authenticate({
    String localizedReason = 'শাকিল ট্রাভেলস ইআরপি সুরক্ষিত প্রবেশে ফিঙ্গারপ্রিন্ট বা ফেস স্ক্যান করুন',
  }) async {
    try {
      final isAvailable = await isBiometricAvailable();
      if (!isAvailable) return false;

      return await _auth.authenticate(
        localizedReason: localizedReason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );
    } on PlatformException catch (e) {
      SafeLogger.warn('Biometric authentication failed: $e');
      return false;
    }
  }
}
