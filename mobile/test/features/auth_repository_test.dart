import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shakil_travels/core/config/app_config.dart';
import 'package:shakil_travels/core/errors/api_exception.dart';
import 'package:shakil_travels/core/network/api_client.dart';
import 'package:shakil_travels/core/security/secure_storage.dart';
import 'package:shakil_travels/features/auth/data/auth_repository.dart';

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

class FakeFlutterSecureStorage extends Fake implements FlutterSecureStorage {
  final Map<String, String> _data = {};

  @override
  Future<void> write({
    required String key,
    required String? value,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    if (value != null) {
      _data[key] = value;
    } else {
      _data.remove(key);
    }
  }

  @override
  Future<String?> read({
    required String key,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    return _data[key];
  }

  @override
  Future<void> delete({
    required String key,
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    _data.remove(key);
  }
}

void main() {
  group('AuthRepository Unit & Contract Tests', () {
    late ApiClient apiClient;
    late MockHttpAdapter mockAdapter;
    late SecureStorageService secureStorage;
    late AuthRepository authRepository;

    setUp(() {
      mockAdapter = MockHttpAdapter();
      final dio = Dio(BaseOptions(baseUrl: 'http://test.local'));
      dio.httpClientAdapter = mockAdapter;

      final fakeStorage = FakeFlutterSecureStorage();
      secureStorage = SecureStorageService(storage: fakeStorage);

      apiClient = ApiClient(
        customDio: dio,
        config: const AppConfig(),
        secureStorage: secureStorage,
      );

      authRepository = AuthRepository(
        apiClient: apiClient,
        secureStorage: secureStorage,
      );
    });

    test(
      'Candidate Login Success saves candidate session to secure storage',
      () async {
        mockAdapter.handler = (options) {
          expect(options.path, equals('/api/portal/auth/login'));
          final data = options.data as Map;
          expect(data['identifier'], equals('01913681771'));
          expect(data['password'], equals('Candidate@123'));

          return ResponseBody.fromString(
            jsonEncode({
              'success': true,
              'token': 'cand_jwt_token_sample',
              'message': 'Logged in successfully',
              'data': {
                'applicant': {
                  'id': 'applicant_101',
                  'applicantNumber': 'SGR-2026-000001',
                  'fullName': 'Rahim Uddin',
                  'phone': '01913681771',
                  'email': 'rahim@shakilglobal.com',
                  'profileCompletion': 95,
                },
              },
            }),
            200,
            headers: {
              Headers.contentTypeHeader: [Headers.jsonContentType],
            },
          );
        };

        final session = await authRepository.loginCandidate(
          identifier: '01913681771',
          password: 'Candidate@123',
        );

        expect(session.isCandidate, isTrue);
        expect(session.applicantNumber, equals('SGR-2026-000001'));
        expect(session.fullName, equals('Rahim Uddin'));
        expect(session.token, equals('cand_jwt_token_sample'));

        // Verify Secure Storage State
        expect(
          await secureStorage.getActiveAccountType(),
          equals(AccountType.candidate),
        );
        expect(
          await secureStorage.getAuthToken(),
          equals('cand_jwt_token_sample'),
        );
      },
    );

    test(
      'Candidate Login Failure with HTTP 401 throws UnauthorizedException',
      () async {
        mockAdapter.handler = (options) {
          return ResponseBody.fromString(
            jsonEncode({
              'success': false,
              'error': 'Invalid credentials. Please check your details.',
            }),
            401,
            headers: {
              Headers.contentTypeHeader: [Headers.jsonContentType],
            },
          );
        };

        expect(
          () => authRepository.loginCandidate(
            identifier: '01913681771',
            password: 'WrongPassword',
          ),
          throwsA(isA<UnauthorizedException>()),
        );
        expect(await secureStorage.hasValidSession(), isFalse);
      },
    );

    test('Candidate Login with HTTP 429 throws RateLimitException', () async {
      mockAdapter.handler = (options) {
        return ResponseBody.fromString(
          jsonEncode({
            'success': false,
            'error':
                'Too many failed login attempts. Please try again after 15 minutes.',
          }),
          429,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      };

      expect(
        () => authRepository.loginCandidate(
          identifier: '01913681771',
          password: 'Password',
        ),
        throwsA(isA<RateLimitException>()),
      );
    });

    test('Staff Login Success saves staff role and permissions', () async {
      mockAdapter.handler = (options) {
        expect(options.path, equals('/api/auth/login'));
        return ResponseBody.fromString(
          jsonEncode({
            'success': true,
            'token': 'staff_jwt_token_sample',
            'data': {
              'id': 'user_staff_01',
              'name': 'Counselor Karim',
              'email': 'karim@shakilglobal.com',
              'role': {'id': 'role_recruitment', 'name': 'RECRUITMENT_STAFF'},
              'permissions': ['APPLICANT_VIEW', 'JOB_VIEW'],
            },
          }),
          200,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      };

      final session = await authRepository.loginStaff(
        email: 'karim@shakilglobal.com',
        password: 'StaffPassword',
      );

      expect(session.isStaff, isTrue);
      expect(session.role, equals('RECRUITMENT_STAFF'));
      expect(session.hasPermission('APPLICANT_VIEW'), isTrue);
      expect(
        await secureStorage.getActiveAccountType(),
        equals(AccountType.staff),
      );
    });

    test(
      'Admin Login verifies portal isolation and rejects non-admin users',
      () async {
        mockAdapter.handler = (options) {
          final data = options.data as Map;
          expect(data['portalType'], equals('ADMIN'));

          // Simulate server returning non-admin user role
          return ResponseBody.fromString(
            jsonEncode({
              'success': true,
              'token': 'regular_staff_token',
              'data': {
                'id': 'user_02',
                'name': 'Staff Member',
                'email': 'staff@test.com',
                'role': {
                  'id': 'role_staff',
                  'name': 'RECRUITMENT_STAFF', // Non-admin!
                },
              },
            }),
            200,
            headers: {
              Headers.contentTypeHeader: [Headers.jsonContentType],
            },
          );
        };

        expect(
          () => authRepository.loginAdmin(
            email: 'staff@test.com',
            password: 'Password',
          ),
          throwsA(isA<ForbiddenException>()),
        );
      },
    );

    test(
      'Session restoration: 401 Unauthorized wipes stored credentials',
      () async {
        await secureStorage.saveCandidateSession(
          token: 'expired_cand_token',
          candidateId: 'c1',
        );

        mockAdapter.handler = (options) {
          expect(options.path, equals('/api/portal/auth/me'));
          return ResponseBody.fromString(
            jsonEncode({'success': false, 'error': 'Unauthenticated'}),
            401,
            headers: {
              Headers.contentTypeHeader: [Headers.jsonContentType],
            },
          );
        };

        final session = await authRepository.restoreSession();
        expect(session, isNull);
        // Validates that expired session is cleanly wiped from Keystore
        expect(await secureStorage.hasValidSession(), isFalse);
      },
    );

    test(
      'Session restoration: Network failure DOES NOT wipe stored credentials',
      () async {
        await secureStorage.saveCandidateSession(
          token: 'valid_offline_token',
          candidateId: 'cand_offline_99',
          applicantNumber: 'SGR-OFFLINE-001',
          fullName: 'Offline Candidate',
        );

        mockAdapter.handler = (options) {
          throw DioException(
            requestOptions: options,
            type: DioExceptionType.connectionTimeout,
            message: 'Connection timed out',
          );
        };

        final session = await authRepository.restoreSession();
        // Verifies offline resilience: returns cached session without wiping Keystore
        expect(session, isNotNull);
        expect(session!.applicantNumber, equals('SGR-OFFLINE-001'));
        expect(await secureStorage.hasValidSession(), isTrue);
      },
    );

    test('Logout calls remote endpoint and clears local session', () async {
      await secureStorage.saveCandidateSession(
        token: 'active_token',
        candidateId: 'cand_1',
      );

      bool logoutEndpointCalled = false;
      mockAdapter.handler = (options) {
        if (options.path == '/api/portal/auth/logout') {
          logoutEndpointCalled = true;
        }
        return ResponseBody.fromString(
          jsonEncode({'success': true}),
          200,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      };

      await authRepository.logout();
      expect(logoutEndpointCalled, isTrue);
      expect(await secureStorage.hasValidSession(), isFalse);
    });
  });
}
