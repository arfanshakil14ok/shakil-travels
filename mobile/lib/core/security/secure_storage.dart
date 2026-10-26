import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Account types supported by the mobile application
enum AccountType { candidate, staff, admin, none }

/// Secure session and credential management backed by Android Keystore.
/// Strictly separates Candidate and Staff/Admin credentials under distinct keys.
/// Tokens are never stored in unencrypted SharedPreferences.
class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(
                encryptedSharedPreferences: true,
                resetOnError: true,
              ),
            );

  // Active Session Pointer
  static const String _keyActiveAccountType = 'sgr_active_account_type';

  // Candidate Session Keys (Prefix: sgr_cand_)
  static const String _keyCandToken = 'sgr_cand_auth_token';
  static const String _keyCandId = 'sgr_cand_user_id';
  static const String _keyCandNumber = 'sgr_cand_applicant_number';
  static const String _keyCandName = 'sgr_cand_full_name';
  static const String _keyCandPhone = 'sgr_cand_phone';
  static const String _keyCandEmail = 'sgr_cand_email';

  // Staff / Admin Session Keys (Prefix: sgr_staff_)
  static const String _keyStaffToken = 'sgr_staff_auth_token';
  static const String _keyStaffId = 'sgr_staff_user_id';
  static const String _keyStaffRole = 'sgr_staff_role';
  static const String _keyStaffName = 'sgr_staff_full_name';
  static const String _keyStaffEmail = 'sgr_staff_email';
  static const String _keyStaffPermissions = 'sgr_staff_permissions';

  /// Saves a verified Candidate session
  Future<void> saveCandidateSession({
    required String token,
    required String candidateId,
    String? applicantNumber,
    String? fullName,
    String? phone,
    String? email,
  }) async {
    await Future.wait([
      _storage.write(key: _keyActiveAccountType, value: 'CANDIDATE'),
      _storage.write(key: _keyCandToken, value: token),
      _storage.write(key: _keyCandId, value: candidateId),
      if (applicantNumber != null)
        _storage.write(key: _keyCandNumber, value: applicantNumber),
      if (fullName != null) _storage.write(key: _keyCandName, value: fullName),
      if (phone != null) _storage.write(key: _keyCandPhone, value: phone),
      if (email != null) _storage.write(key: _keyCandEmail, value: email),
    ]);
  }

  /// Saves a verified Staff or Admin session
  Future<void> saveStaffSession({
    required String token,
    required String staffId,
    required String role,
    required String fullName,
    required String email,
    List<String> permissions = const [],
  }) async {
    final accountType =
        (role == 'SUPER_ADMIN' || role == 'ADMIN') ? 'ADMIN' : 'STAFF';
    await Future.wait([
      _storage.write(key: _keyActiveAccountType, value: accountType),
      _storage.write(key: _keyStaffToken, value: token),
      _storage.write(key: _keyStaffId, value: staffId),
      _storage.write(key: _keyStaffRole, value: role),
      _storage.write(key: _keyStaffName, value: fullName),
      _storage.write(key: _keyStaffEmail, value: email),
      _storage.write(key: _keyStaffPermissions, value: permissions.join(',')),
    ]);
  }

  /// Retrieves the active account type (CANDIDATE, STAFF, ADMIN, NONE)
  Future<AccountType> getActiveAccountType() async {
    final typeStr = await _storage.read(key: _keyActiveAccountType);
    switch (typeStr) {
      case 'CANDIDATE':
        return AccountType.candidate;
      case 'STAFF':
        return AccountType.staff;
      case 'ADMIN':
        return AccountType.admin;
      default:
        return AccountType.none;
    }
  }

  /// Retrieves the active authentication token based on currently active account
  Future<String?> getAuthToken() async {
    final activeType = await getActiveAccountType();
    if (activeType == AccountType.candidate) {
      return await _storage.read(key: _keyCandToken);
    } else if (activeType == AccountType.staff ||
        activeType == AccountType.admin) {
      return await _storage.read(key: _keyStaffToken);
    }
    return null;
  }

  /// Retrieves the active role name
  Future<String?> getUserRole() async {
    final activeType = await getActiveAccountType();
    if (activeType == AccountType.candidate) {
      return 'CANDIDATE';
    } else if (activeType == AccountType.staff ||
        activeType == AccountType.admin) {
      return await _storage.read(key: _keyStaffRole);
    }
    return null;
  }

  /// Retrieves candidate session details
  Future<Map<String, String?>> getCandidateData() async {
    return {
      'token': await _storage.read(key: _keyCandToken),
      'id': await _storage.read(key: _keyCandId),
      'applicantNumber': await _storage.read(key: _keyCandNumber),
      'fullName': await _storage.read(key: _keyCandName),
      'phone': await _storage.read(key: _keyCandPhone),
      'email': await _storage.read(key: _keyCandEmail),
    };
  }

  /// Retrieves staff/admin session details
  Future<Map<String, dynamic>> getStaffData() async {
    final permsRaw = await _storage.read(key: _keyStaffPermissions);
    final permissions = permsRaw != null && permsRaw.isNotEmpty
        ? permsRaw.split(',')
        : <String>[];

    return {
      'token': await _storage.read(key: _keyStaffToken),
      'id': await _storage.read(key: _keyStaffId),
      'role': await _storage.read(key: _keyStaffRole),
      'fullName': await _storage.read(key: _keyStaffName),
      'email': await _storage.read(key: _keyStaffEmail),
      'permissions': permissions,
    };
  }

  Future<bool> hasValidSession() async {
    final token = await getAuthToken();
    return token != null && token.isNotEmpty;
  }

  /// Clears only the active session
  Future<void> clearActiveSession() async {
    final activeType = await getActiveAccountType();
    if (activeType == AccountType.candidate) {
      await clearCandidateSession();
    } else {
      await clearStaffSession();
    }
    await _storage.delete(key: _keyActiveAccountType);
  }

  /// Clears session (alias to clearActiveSession)
  Future<void> clearSession() => clearActiveSession();

  /// Clears candidate stored session
  Future<void> clearCandidateSession() async {
    await Future.wait([
      _storage.delete(key: _keyCandToken),
      _storage.delete(key: _keyCandId),
      _storage.delete(key: _keyCandNumber),
      _storage.delete(key: _keyCandName),
      _storage.delete(key: _keyCandPhone),
      _storage.delete(key: _keyCandEmail),
    ]);
  }

  /// Clears staff/admin stored session
  Future<void> clearStaffSession() async {
    await Future.wait([
      _storage.delete(key: _keyStaffToken),
      _storage.delete(key: _keyStaffId),
      _storage.delete(key: _keyStaffRole),
      _storage.delete(key: _keyStaffName),
      _storage.delete(key: _keyStaffEmail),
      _storage.delete(key: _keyStaffPermissions),
    ]);
  }

  /// Clears all sessions and tokens (full wipe)
  Future<void> clearAll() async {
    await Future.wait([
      clearCandidateSession(),
      clearStaffSession(),
      _storage.delete(key: _keyActiveAccountType),
    ]);
  }
}
