import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shakil_travels/core/errors/api_exception.dart';
import 'package:shakil_travels/core/network/api_client.dart';
import 'package:shakil_travels/core/security/biometric_auth_service.dart';
import 'package:shakil_travels/core/security/secure_storage.dart';
import 'package:shakil_travels/features/admin/presentation/screens/admin_main_navigation_screen.dart';
import 'package:shakil_travels/features/auth/data/auth_repository.dart';
import 'package:shakil_travels/features/auth/data/session_model.dart';
import 'package:shakil_travels/features/auth/presentation/candidate_register_screen.dart';
import 'package:shakil_travels/features/auth/presentation/unified_login_screen.dart';
import 'package:shakil_travels/features/candidate/presentation/screens/candidate_main_navigation_screen.dart';
import 'package:shakil_travels/features/staff/presentation/screens/staff_main_navigation_screen.dart';

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

class FakeBiometricAuth extends Fake implements BiometricAuthService {
  final bool available;
  final bool authSuccess;

  FakeBiometricAuth({this.available = true, this.authSuccess = true});

  @override
  Future<bool> isBiometricAvailable() async => available;

  @override
  Future<bool> authenticate({String localizedReason = ''}) async => authSuccess;

  @override
  Future<List<BiometricType>> getAvailableBiometrics() async => [
        BiometricType.fingerprint,
      ];
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Dio dio;
  late MockHttpAdapter mockAdapter;
  late ApiClient apiClient;
  late SecureStorageService secureStorage;
  late AuthRepository authRepository;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    dio = Dio(BaseOptions(baseUrl: 'http://test.local'));
    mockAdapter = MockHttpAdapter();
    dio.httpClientAdapter = mockAdapter;
    apiClient = ApiClient(dio: dio);
    secureStorage = SecureStorageService();
    authRepository = AuthRepository(
      apiClient: apiClient,
      secureStorage: secureStorage,
    );
  });

  group('Phase 6.1: Unified Login Screen & Automatic Role Navigation Tests', () {
    testWidgets('UnifiedLoginScreen renders all branding, inputs and actions', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        MaterialApp(
          home: UnifiedLoginScreen(
            authRepository: authRepository,
            biometricAuth: FakeBiometricAuth(available: true),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Official Branding & Header
      expect(find.text('SHAKILWORK ERP'), findsOneWidget);
      expect(find.text('শাকিল ট্রাভেলস ইআরপি'), findsOneWidget);
      expect(find.text('GOVT APPROVED RL-2579'), findsOneWidget);
      expect(find.text('প্রবেশ করুন (Sign In)'), findsOneWidget);

      // Inputs & Buttons
      expect(find.text('ইউজার আইডি / মোবাইল / ইমেইল'), findsOneWidget);
      expect(find.text('পাসওয়ার্ড (Password)'), findsOneWidget);
      expect(find.text('লগইন করুন (Sign In)'), findsOneWidget);
      expect(find.byIcon(Icons.fingerprint_rounded), findsOneWidget);
      expect(
        find.text('নতুন প্রার্থী? নিবন্ধন করুন (New Candidate?)'),
        findsOneWidget,
      );
      expect(find.text('লগইন করতে সমস্যা হচ্ছে? সহায়তা নিন'), findsOneWidget);
    });

    testWidgets('Validates empty inputs and toggles password visibility', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        MaterialApp(
          home: UnifiedLoginScreen(
            authRepository: authRepository,
            biometricAuth: FakeBiometricAuth(available: false),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Sign In with empty fields -> Triggers Form Validation
      await tester.tap(find.text('লগইন করুন (Sign In)'));
      await tester.pumpAndSettle();

      expect(
        find.text('মোবাইল নম্বর, আবেদন আইডি বা ইমেইল লিখুন'),
        findsOneWidget,
      );
      expect(find.text('পাসওয়ার্ড আবশ্যক'), findsOneWidget);

      // Verify Password Visibility Toggle
      final visibilityIcon = find.byIcon(Icons.visibility_off_rounded);
      expect(visibilityIcon, findsOneWidget);
      await tester.tap(visibilityIcon);
      await tester.pumpAndSettle();
      expect(find.byIcon(Icons.visibility_rounded), findsOneWidget);
    });

    testWidgets('Incorrect password displays server error banner', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      mockAdapter.handler = (options) {
        return ResponseBody.fromString(
          jsonEncode({
            'success': false,
            'error': 'ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।',
          }),
          401,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      };

      await tester.pumpWidget(
        MaterialApp(
          home: UnifiedLoginScreen(
            authRepository: authRepository,
            biometricAuth: FakeBiometricAuth(available: false),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byType(TextFormField).first,
        '01913681771',
      );
      await tester.enterText(find.byType(TextFormField).last, 'wrong_pass');
      await tester.tap(find.text('লগইন করুন (Sign In)'));
      await tester.pumpAndSettle();

      expect(find.text('ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।'), findsOneWidget);
    });

    testWidgets(
      'Candidate login navigates automatically to CandidateMainNavigationScreen',
      (tester) async {
        tester.view.physicalSize = const Size(800, 1400);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);

        mockAdapter.handler = (options) {
          if (options.path.contains('/api/portal/auth/login')) {
            return ResponseBody.fromString(
              jsonEncode({
                'success': true,
                'token': 'cand_jwt_token_verified_2026',
                'userType': 'CANDIDATE',
                'role': 'CANDIDATE',
                'message': 'Logged in successfully',
                'data': {
                  'applicant': {
                    'id': 'cand-uuid-101',
                    'applicantNumber': 'SGR-2026-000101',
                    'fullName': 'Md. Shakil Ahmed',
                    'phone': '01913681771',
                    'email': 'shakil@test.com',
                    'role': 'CANDIDATE',
                    'profileCompletion': 85,
                  },
                },
              }),
              200,
              headers: {
                Headers.contentTypeHeader: [Headers.jsonContentType],
              },
            );
          }
          return ResponseBody.fromString('{}', 200);
        };

        await tester.pumpWidget(
          MaterialApp(
            home: UnifiedLoginScreen(
              authRepository: authRepository,
              biometricAuth: FakeBiometricAuth(available: false),
            ),
          ),
        );
        await tester.pumpAndSettle();

        await tester.enterText(
          find.byType(TextFormField).first,
          '01913681771',
        );
        await tester.enterText(find.byType(TextFormField).last, 'correct_pass');
        await tester.tap(find.text('লগইন করুন (Sign In)'));
        
        for (int i = 0; i < 10; i++) {
          await tester.pump(const Duration(milliseconds: 100));
        }

        // Must automatically navigate to CandidateMainNavigationScreen
        expect(find.byType(CandidateMainNavigationScreen), findsOneWidget);
      },
    );

    testWidgets(
      'Staff login navigates automatically to StaffMainNavigationScreen',
      (tester) async {
        tester.view.physicalSize = const Size(800, 1400);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);

        mockAdapter.handler = (options) {
          if (options.path.contains('/api/portal/auth/login')) {
            return ResponseBody.fromString(
              jsonEncode({
                'success': true,
                'token': 'staff_jwt_token_verified_2026',
                'userType': 'STAFF',
                'role': 'RECRUITMENT_MANAGER',
                'message': 'ERP RECRUITMENT_MANAGER হিসেবে সফলভাবে লগইন হয়েছে',
                'data': {
                  'user': {
                    'id': 'staff-uuid-202',
                    'name': 'Farhana Yeasmin',
                    'email': 'farhana@shakiltravels.com',
                    'phone': '01811223344',
                    'role': 'RECRUITMENT_MANAGER',
                    'permissions': ['APPLICANT_VIEW', 'VISA_PROCESSING_VIEW'],
                  },
                },
              }),
              200,
              headers: {
                Headers.contentTypeHeader: [Headers.jsonContentType],
              },
            );
          }
          return ResponseBody.fromString('{}', 200);
        };

        await tester.pumpWidget(
          MaterialApp(
            home: UnifiedLoginScreen(
              authRepository: authRepository,
              biometricAuth: FakeBiometricAuth(available: false),
            ),
          ),
        );
        await tester.pumpAndSettle();

        await tester.enterText(
          find.byType(TextFormField).first,
          'farhana@shakiltravels.com',
        );
        await tester.enterText(find.byType(TextFormField).last, 'staff_pass');
        await tester.tap(find.text('লগইন করুন (Sign In)'));
        await tester.pumpAndSettle();

        // Must automatically navigate to StaffMainNavigationScreen
        expect(find.byType(StaffMainNavigationScreen), findsOneWidget);
      },
    );

    testWidgets(
      'Admin / SuperAdmin login navigates automatically to AdminMainNavigationScreen',
      (tester) async {
        tester.view.physicalSize = const Size(800, 1400);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);

        mockAdapter.handler = (options) {
          if (options.path.contains('/api/portal/auth/login')) {
            return ResponseBody.fromString(
              jsonEncode({
                'success': true,
                'token': 'admin_jwt_token_verified_2026',
                'userType': 'STAFF',
                'role': 'SUPER_ADMIN',
                'message': 'ERP SUPER_ADMIN হিসেবে সফলভাবে লগইন হয়েছে',
                'data': {
                  'user': {
                    'id': 'admin-uuid-001',
                    'name': 'Managing Director',
                    'email': 'admin@shakiltravels.com',
                    'phone': '01913681771',
                    'role': 'SUPER_ADMIN',
                    'permissions': ['SUPER_ADMIN_ALL'],
                  },
                },
              }),
              200,
              headers: {
                Headers.contentTypeHeader: [Headers.jsonContentType],
              },
            );
          }
          return ResponseBody.fromString('{}', 200);
        };

        await tester.pumpWidget(
          MaterialApp(
            home: UnifiedLoginScreen(
              authRepository: authRepository,
              biometricAuth: FakeBiometricAuth(available: false),
            ),
          ),
        );
        await tester.pumpAndSettle();

        await tester.enterText(
          find.byType(TextFormField).first,
          'admin@shakiltravels.com',
        );
        await tester.enterText(find.byType(TextFormField).last, 'admin_pass');
        await tester.tap(find.text('লগইন করুন (Sign In)'));
        await tester.pumpAndSettle();

        // Must automatically navigate to AdminMainNavigationScreen
        expect(find.byType(AdminMainNavigationScreen), findsOneWidget);
      },
    );

    testWidgets('Unknown / Unauthorized role is denied safely', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      mockAdapter.handler = (options) {
        return ResponseBody.fromString(
          jsonEncode({
            'success': true,
            'token': 'fake_token',
            'userType': 'STAFF',
            'role': 'UNKNOWN_HACKER_ROLE',
            'data': {
              'user': {
                'id': 'hacker-001',
                'role': 'UNKNOWN_HACKER_ROLE',
              },
            },
          }),
          200,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      };

      await tester.pumpWidget(
        MaterialApp(
          home: UnifiedLoginScreen(
            authRepository: authRepository,
            biometricAuth: FakeBiometricAuth(available: false),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byType(TextFormField).first,
        'unknown@user.com',
      );
      await tester.enterText(find.byType(TextFormField).last, 'password123');
      await tester.tap(find.text('লগইন করুন (Sign In)'));
      await tester.pumpAndSettle();

      expect(
        find.textContaining('অননুমোদিত পদবী (UNKNOWN_HACKER_ROLE)'),
        findsOneWidget,
      );
    });

    testWidgets('Registration button navigates to CandidateRegisterScreen', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        MaterialApp(
          home: UnifiedLoginScreen(
            authRepository: authRepository,
            biometricAuth: FakeBiometricAuth(available: false),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(
        find.text('নতুন প্রার্থী? নিবন্ধন করুন (New Candidate?)'),
      );
      await tester.pumpAndSettle();

      expect(find.byType(CandidateRegisterScreen), findsOneWidget);
    });

    testWidgets('Helpline bottom sheet opens on support tap', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        MaterialApp(
          home: UnifiedLoginScreen(
            authRepository: authRepository,
            biometricAuth: FakeBiometricAuth(available: false),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('লগইন করতে সমস্যা হচ্ছে? সহায়তা নিন'));
      await tester.pumpAndSettle();

      expect(find.text('লগইন সহায়তা ও হেল্পলাইন'), findsOneWidget);
      expect(find.text('হটলাইন হেল্পলাইন'), findsOneWidget);
      expect(find.text('হোয়াটসঅ্যাপ সাপোর্ট'), findsOneWidget);
    });

    test('AuthRepository loginUnified parses roles and persists to SecureStorage',
        () async {
      mockAdapter.handler = (options) {
        return ResponseBody.fromString(
          jsonEncode({
            'success': true,
            'token': 'cand_jwt_12345',
            'userType': 'CANDIDATE',
            'data': {
              'applicant': {
                'id': 'cand-1',
                'applicantNumber': 'SGR-2026-0001',
                'fullName': 'Karim Ullah',
                'phone': '01700000000',
              },
            },
          }),
          200,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      };

      final session = await authRepository.loginUnified(
        identifier: '01700000000',
        password: 'password123',
      );

      expect(session.isCandidate, isTrue);
      expect(session.applicantNumber, equals('SGR-2026-0001'));

      final token = await secureStorage.getAuthToken();
      expect(token, equals('cand_jwt_12345'));

      final accountType = await secureStorage.getActiveAccountType();
      expect(accountType, equals(AccountType.candidate));
    });

    test('AuthRepository loginUnified rejects empty identifier or password',
        () async {
      expect(
        () => authRepository.loginUnified(identifier: '', password: '123'),
        throwsA(isA<ApiException>()),
      );

      expect(
        () => authRepository.loginUnified(identifier: '01913681771', password: ''),
        throwsA(isA<ApiException>()),
      );
    });

    test('SessionModel maps all roles according to authoritative RBAC', () {
      final cand = SessionModel.fromUnifiedJson({
        'token': 't1',
        'userType': 'CANDIDATE',
        'data': {'applicant': {'id': 'c1'}},
      });
      expect(cand.isCandidate, isTrue);
      expect(cand.isStaff, isFalse);
      expect(cand.isAdmin, isFalse);
      expect(cand.isValidRole, isTrue);

      final recruiter = SessionModel.fromUnifiedJson({
        'token': 't2',
        'userType': 'STAFF',
        'role': 'RECRUITER',
        'data': {'user': {'id': 's1'}},
      });
      expect(recruiter.isCandidate, isFalse);
      expect(recruiter.isStaff, isTrue);
      expect(recruiter.isAdmin, isFalse);
      expect(recruiter.isValidRole, isTrue);

      final admin = SessionModel.fromUnifiedJson({
        'token': 't3',
        'userType': 'STAFF',
        'role': 'ADMIN',
        'data': {'user': {'id': 'a1'}},
      });
      expect(admin.isCandidate, isFalse);
      expect(admin.isStaff, isTrue);
      expect(admin.isAdmin, isTrue);
      expect(admin.isValidRole, isTrue);

      final superAdmin = SessionModel.fromUnifiedJson({
        'token': 't4',
        'userType': 'STAFF',
        'role': 'SUPER_ADMIN',
        'data': {'user': {'id': 'sa1'}},
      });
      expect(superAdmin.isCandidate, isFalse);
      expect(superAdmin.isStaff, isTrue);
      expect(superAdmin.isAdmin, isTrue);
      expect(superAdmin.isSuperAdmin, isTrue);
      expect(superAdmin.isValidRole, isTrue);

      final invalid = SessionModel.fromUnifiedJson({
        'token': 't5',
        'userType': 'STAFF',
        'role': 'FAKE_ROLE',
        'data': {'user': {'id': 'x1'}},
      });
      expect(invalid.isValidRole, isFalse);
    });
  });
}
