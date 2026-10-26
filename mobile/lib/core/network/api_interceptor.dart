import 'package:dio/dio.dart';

import '../security/secure_storage.dart';
import 'safe_logger.dart';

/// Request and Response interceptor that:
/// 1. Injects Bearer token and Cookie session automatically
/// 2. Sanitizes debug logs to prevent credential leakage
/// 3. Intercepts 401 responses for session invalidation
class ApiInterceptor extends Interceptor {
  final SecureStorageService _secureStorage;
  final void Function()? _onUnauthorized;

  ApiInterceptor({
    required SecureStorageService secureStorage,
    void Function()? onUnauthorized,
  })  : _secureStorage = secureStorage,
        _onUnauthorized = onUnauthorized;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _secureStorage.getAuthToken();
    final role = await _secureStorage.getUserRole();

    if (token != null && token.isNotEmpty) {
      // 1. Standard Mobile Header
      options.headers['Authorization'] = 'Bearer $token';

      // 2. Cookie compatibility bridge for existing Next.js backend
      final cookieName =
          (role == 'CANDIDATE') ? 'sgr_portal_session' : 'sgr_session';
      options.headers['Cookie'] = '$cookieName=$token';
    }

    options.headers['Accept'] = 'application/json';
    options.headers['X-Client-Platform'] = 'android';
    options.headers['X-Client-Version'] = '1.0.0';

    SafeLogger.info('HTTP ${options.method} -> ${options.uri}');
    if (options.data != null) {
      SafeLogger.info('Payload: ${SafeLogger.sanitize(options.data)}');
    }

    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    SafeLogger.info(
      'HTTP ${response.statusCode} <- ${response.requestOptions.uri}',
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    SafeLogger.error(
      'HTTP Error ${err.response?.statusCode} on ${err.requestOptions.uri}: ${err.message}',
    );

    if (err.response?.statusCode == 401) {
      SafeLogger.warn('401 Unauthorized detected. Triggering session cleanup.');
      _secureStorage.clearActiveSession();
      _onUnauthorized?.call();
    }

    handler.next(err);
  }
}
