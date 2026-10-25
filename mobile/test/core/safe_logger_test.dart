import 'package:flutter_test/flutter_test.dart';
import 'package:shakil_travels/core/network/safe_logger.dart';

void main() {
  group('SafeLogger Redaction Tests', () {
    test('Redacts password, token, and sensitive fields from maps', () {
      final sensitivePayload = {
        'identifier': '01913681771',
        'password': 'SuperSecretPassword123!',
        'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'jwt': 'secret_jwt_data',
        'publicField': 'Allowed Information',
      };

      final sanitized = SafeLogger.sanitize(sensitivePayload) as Map<String, dynamic>;

      expect(sanitized['password'], equals('[REDACTED]'));
      expect(sanitized['token'], equals('[REDACTED]'));
      expect(sanitized['jwt'], equals('[REDACTED]'));
      expect(sanitized['identifier'], equals('01913681771'));
      expect(sanitized['publicField'], equals('Allowed Information'));
    });

    test('Redacts nested maps and lists', () {
      final nestedData = {
        'user': {
          'name': 'Md. Shakil',
          'secret': 'nested_secret',
        },
        'items': [
          {'otp': '123456'},
          {'status': 'ACTIVE'},
        ],
      };

      final sanitized = SafeLogger.sanitize(nestedData) as Map<String, dynamic>;

      expect(sanitized['user']['secret'], equals('[REDACTED]'));
      expect(sanitized['user']['name'], equals('Md. Shakil'));
      expect(sanitized['items'][0]['otp'], equals('[REDACTED]'));
      expect(sanitized['items'][1]['status'], equals('ACTIVE'));
    });
  });
}
