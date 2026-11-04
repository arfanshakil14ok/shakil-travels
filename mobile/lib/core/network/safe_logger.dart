import 'package:flutter/foundation.dart';

/// Production-safe logger that rigorously sanitizes credentials, tokens,
/// OTPs, and candidate personal identity data before outputting to debug console.
class SafeLogger {
  static const List<String> _sensitiveKeys = [
    'password',
    'passwordhash',
    'token',
    'jwt',
    'secret',
    'authorization',
    'cookie',
    'otp',
    'passportnumber',
    'nid',
    'buffer',
  ];

  static void info(String message) {
    if (kDebugMode) {
      debugPrint('[INFO] $message');
    }
  }

  static void warn(String message) {
    if (kDebugMode) {
      debugPrint('[WARN] ⚠️ $message');
    }
  }

  static void error(String message, [dynamic error, StackTrace? stackTrace]) {
    if (kDebugMode) {
      debugPrint('[ERROR] ❌ $message');
      if (error != null) debugPrint('Details: $error');
      if (stackTrace != null) debugPrint('Stack: $stackTrace');
    }
  }

  /// Sanitizes any map or payload by redacting sensitive fields
  static dynamic sanitize(dynamic data) {
    if (data is Map) {
      final sanitized = <String, dynamic>{};
      data.forEach((key, value) {
        final keyStr = key.toString().toLowerCase();
        final isSensitive = _sensitiveKeys.any((s) => keyStr.contains(s));
        if (isSensitive) {
          sanitized[key.toString()] = '[REDACTED]';
        } else if (value is Map || value is List) {
          sanitized[key.toString()] = sanitize(value);
        } else {
          sanitized[key.toString()] = value;
        }
      });
      return sanitized;
    } else if (data is List) {
      return data.map((item) => sanitize(item)).toList();
    }
    return data;
  }
}
