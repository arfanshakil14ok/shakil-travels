import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shakil_travels/core/config/app_config.dart';
import 'package:shakil_travels/core/errors/api_exception.dart';
import 'package:shakil_travels/core/network/api_client.dart';

class MockHttpAdapter implements HttpClientAdapter {
  late ResponseBody Function(RequestOptions options) handler;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return handler(options);
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  group('ApiClient Mocked Endpoint & Error Tests', () {
    late ApiClient apiClient;
    late MockHttpAdapter mockAdapter;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      mockAdapter = MockHttpAdapter();
      final dio = Dio(BaseOptions(baseUrl: 'http://test.local'));
      dio.httpClientAdapter = mockAdapter;

      apiClient = ApiClient(customDio: dio, config: const AppConfig());
    });

    test('Successful GET parses response correctly', () async {
      mockAdapter.handler = (options) {
        return ResponseBody.fromString(
          jsonEncode({'status': 'healthy', 'service': 'SHAKIL TRAVELS ERP'}),
          200,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      };

      final data = await apiClient.get('/api/health');
      expect(data['status'], equals('healthy'));
      expect(data['service'], equals('SHAKIL TRAVELS ERP'));
    });

    test('HTTP 401 throws UnauthorizedException', () async {
      mockAdapter.handler = (options) {
        return ResponseBody.fromString(
          jsonEncode({'error': 'Invalid credentials'}),
          401,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      };

      expect(
        () => apiClient.get('/api/auth/me'),
        throwsA(isA<UnauthorizedException>()),
      );
    });

    test('HTTP 403 throws ForbiddenException', () async {
      mockAdapter.handler = (options) {
        return ResponseBody.fromString(
          jsonEncode({'error': 'Forbidden access'}),
          403,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      };

      expect(
        () => apiClient.get('/api/admin/users'),
        throwsA(isA<ForbiddenException>()),
      );
    });

    test('HTTP 404 throws NotFoundException', () async {
      mockAdapter.handler = (options) {
        return ResponseBody.fromString(
          jsonEncode({'error': 'Resource not found'}),
          404,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      };

      expect(
        () => apiClient.get('/api/invalid-route'),
        throwsA(isA<NotFoundException>()),
      );
    });

    test('HTTP 429 throws RateLimitException', () async {
      mockAdapter.handler = (options) {
        return ResponseBody.fromString(
          jsonEncode({'error': 'Too many requests'}),
          429,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      };

      expect(
        () => apiClient.post('/api/portal/auth/login', data: {}),
        throwsA(isA<RateLimitException>()),
      );
    });

    test('HTTP 500 throws ServerException', () async {
      mockAdapter.handler = (options) {
        return ResponseBody.fromString(
          jsonEncode({'error': 'Database failure'}),
          500,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      };

      expect(() => apiClient.get('/api/jobs'), throwsA(isA<ServerException>()));
    });
  });
}
