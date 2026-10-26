import 'dart:io';

import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../errors/api_exception.dart';
import '../security/secure_storage.dart';
import 'api_endpoints.dart';
import 'api_interceptor.dart';
import 'safe_logger.dart';

/// Reusable HTTP client configured for SHAKIL TRAVELS ERP backend.
/// Strictly handles environment-specific URLs, timeouts, errors, and authentication.
class ApiClient {
  late final Dio _dio;
  final AppConfig config;
  final SecureStorageService secureStorage;

  ApiClient({
    AppConfig? config,
    SecureStorageService? secureStorage,
    Dio? customDio,
    Dio? dio,
    void Function()? onUnauthorized,
  })  : config = config ?? AppConfig.current,
        secureStorage = secureStorage ?? SecureStorageService() {
    _dio = dio ??
        customDio ??
        Dio(
          BaseOptions(
            baseUrl: this.config.apiBaseUrl,
            connectTimeout: AppConfig.connectTimeout,
            receiveTimeout: AppConfig.receiveTimeout,
            sendTimeout: AppConfig.sendTimeout,
            validateStatus: (status) =>
                status != null && status >= 200 && status < 300,
          ),
        );

    _dio.interceptors.add(
      ApiInterceptor(
        secureStorage: this.secureStorage,
        onUnauthorized: onUnauthorized,
      ),
    );
  }

  /// Low-level access to Dio instance (for testing)
  Dio get dio => _dio;

  /// Performs a verified GET request
  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.get(
        path,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(message: 'Unexpected error: $e');
    }
  }

  /// Performs a verified POST request
  Future<dynamic> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(message: 'Unexpected error: $e');
    }
  }

  /// Performs a verified PUT request
  Future<dynamic> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.put(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw _handleDioError(
        e is DioException
            ? e
            : DioException(requestOptions: RequestOptions(path: path)),
      );
    }
  }

  /// Performs an authenticated multipart file upload (e.g. candidate passport/photo)
  Future<dynamic> uploadMultipart(
    String path, {
    required FormData formData,
    ProgressCallback? onSendProgress,
  }) async {
    try {
      final response = await _dio.post(
        path,
        data: formData,
        onSendProgress: onSendProgress,
        options: Options(contentType: 'multipart/form-data'),
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// Probes the backend health endpoint (/api/health)
  Future<bool> checkBackendHealth() async {
    try {
      final data = await get(ApiEndpoints.health);
      if (data is Map && data['status'] == 'healthy') {
        SafeLogger.info(
          'Backend health check verified successfully: ${data['service']}',
        );
        return true;
      }
      return false;
    } catch (e) {
      SafeLogger.warn('Backend health check probe failed: $e');
      return false;
    }
  }

  /// Maps Dio exceptions to domain-specific ApiExceptions
  ApiException _handleDioError(DioException error) {
    final response = error.response;
    final statusCode = response?.statusCode;
    final data = response?.data;
    String errorMessage = 'A network communication error occurred';

    if (data is Map && data.containsKey('error')) {
      errorMessage = data['error'].toString();
      final blockers = data['blockers'];
      if (blockers is List && blockers.isNotEmpty) {
        errorMessage = '$errorMessage: ${blockers.join(", ")}';
      }
    } else if (error.message != null && error.message!.isNotEmpty) {
      errorMessage = error.message!;
    }

    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.error is SocketException) {
      return const NetworkException();
    }

    switch (statusCode) {
      case 401:
        return UnauthorizedException(message: errorMessage, details: data);
      case 403:
        return ForbiddenException(message: errorMessage, details: data);
      case 404:
        return NotFoundException(message: errorMessage, details: data);
      case 429:
        return RateLimitException(message: errorMessage, details: data);
      default:
        if (statusCode != null && statusCode >= 500) {
          return ServerException(
            message: errorMessage,
            statusCode: statusCode,
            details: data,
          );
        }
        return ApiException(
          message: errorMessage,
          statusCode: statusCode,
          details: data,
        );
    }
  }
}
