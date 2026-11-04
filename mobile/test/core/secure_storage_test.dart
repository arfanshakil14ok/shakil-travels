import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shakil_travels/core/security/secure_storage.dart';

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

  @override
  Future<void> deleteAll({
    AppleOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    _data.clear();
  }
}

void main() {
  group('SecureStorageService Unit Tests', () {
    late FakeFlutterSecureStorage fakeStorage;
    late SecureStorageService storageService;

    setUp(() {
      fakeStorage = FakeFlutterSecureStorage();
      storageService = SecureStorageService(storage: fakeStorage);
    });

    test(
        'Candidate and Staff sessions are strictly separated under different keys',
        () async {
      // 1. Save Candidate Session
      await storageService.saveCandidateSession(
        token: 'jwt_candidate_secret_token_123',
        candidateId: 'cand_id_001',
        applicantNumber: 'SGR-2026-000001',
        fullName: 'Md. Shakil Ahmed',
        phone: '01913681771',
      );

      expect(
        await storageService.getActiveAccountType(),
        equals(AccountType.candidate),
      );
      expect(
        await storageService.getAuthToken(),
        equals('jwt_candidate_secret_token_123'),
      );
      expect(await storageService.getUserRole(), equals('CANDIDATE'));

      // 2. Save Staff Session
      await storageService.saveStaffSession(
        token: 'jwt_staff_secret_token_456',
        staffId: 'staff_id_002',
        role: 'RECRUITMENT_STAFF',
        fullName: 'Counselor Rahman',
        email: 'staff@shakilglobal.com',
        permissions: ['APPLICANT_VIEW', 'DOCUMENT_VERIFY'],
      );

      expect(
        await storageService.getActiveAccountType(),
        equals(AccountType.staff),
      );
      expect(
        await storageService.getAuthToken(),
        equals('jwt_staff_secret_token_456'),
      );
      expect(await storageService.getUserRole(), equals('RECRUITMENT_STAFF'));

      // Verify candidate data is still intact under its separate keys
      final candData = await storageService.getCandidateData();
      expect(candData['token'], equals('jwt_candidate_secret_token_123'));
      expect(candData['applicantNumber'], equals('SGR-2026-000001'));

      // Verify staff data is preserved under staff keys
      final staffData = await storageService.getStaffData();
      expect(staffData['token'], equals('jwt_staff_secret_token_456'));
      expect(staffData['permissions'], contains('DOCUMENT_VERIFY'));
    });

    test(
        'Clear active session wipes active account and leaves other account untouched',
        () async {
      await storageService.saveCandidateSession(
        token: 'cand_token',
        candidateId: 'cand_01',
      );
      await storageService.saveStaffSession(
        token: 'staff_token',
        staffId: 'staff_01',
        role: 'ADMIN',
        fullName: 'Super Admin',
        email: 'admin@shakilglobal.com',
      );

      // Active session is currently ADMIN
      expect(
        await storageService.getActiveAccountType(),
        equals(AccountType.admin),
      );

      // Clear active (staff/admin) session
      await storageService.clearActiveSession();

      expect(
        await storageService.getActiveAccountType(),
        equals(AccountType.none),
      );
      expect(await storageService.getAuthToken(), isNull);

      // Candidate keys still persist
      final cand = await storageService.getCandidateData();
      expect(cand['token'], equals('cand_token'));
    });

    test('clearAll performs full wipe across all keys', () async {
      await storageService.saveCandidateSession(
        token: 'cand_token',
        candidateId: 'c1',
      );
      await storageService.saveStaffSession(
        token: 'staff_token',
        staffId: 's1',
        role: 'STAFF',
        fullName: 'Staff',
        email: 'staff@test.com',
      );

      await storageService.clearAll();

      expect(await storageService.hasValidSession(), isFalse);
      expect(
        await storageService.getActiveAccountType(),
        equals(AccountType.none),
      );
    });
  });
}
