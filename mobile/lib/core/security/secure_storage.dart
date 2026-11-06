import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Account types supported by the mobile application
enum AccountType { candidate, staff, admin, none }

/// Secure session and credential management backed by Android Keystore.
/// Strictly separates Candidate and Staff/Admin credentials under distinct keys.
/// Tokens are never stored in unencrypted SharedPreferences.
class SecureStorageService {
  final FlutterSecureStorage _storage;

  // In-memory fast cache to eliminate race conditions and hardware TEE latencies
  static String? _cachedAuthToken;
  static String? _cachedUserRole;
  static AccountType _cachedAccountType = AccountType.none;

  /// Warm in-memory session directly from memory
  static void warmSession({required String token, required String role}) {
    _cachedAuthToken = token;
    _cachedUserRole = role.toUpperCase();
    if (role.toUpperCase() == 'CANDIDATE') {
      _cachedAccountType = AccountType.candidate;
    } else if (role.toUpperCase() == 'ADMIN' || role.toUpperCase() == 'SUPER_ADMIN') {
      _cachedAccountType = AccountType.admin;
    } else {
      _cachedAccountType = AccountType.staff;
    }
  }

  static void resetCache() {
    _cachedAuthToken = null;
    _cachedUserRole = null;
    _cachedAccountType = AccountType.none;
  }

  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(
                encryptedSharedPreferences: true,
                resetOnError: true,
              ),
            ) {
    if (storage != null) {
      resetCache();
    }
  }

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
    // Populate in-memory cache immediately
    _cachedAuthToken = token;
    _cachedUserRole = 'CANDIDATE';
    _cachedAccountType = AccountType.candidate;

    // Sequential writes to prevent Android EncryptedSharedPreferences concurrency crash
    await _storage.write(key: _keyActiveAccountType, value: 'CANDIDATE');
    await _storage.write(key: _keyCandToken, value: token);
    await _storage.write(key: _keyCandId, value: candidateId);
    if (applicantNumber != null) {
      await _storage.write(key: _keyCandNumber, value: applicantNumber);
    }
    if (fullName != null) {
      await _storage.write(key: _keyCandName, value: fullName);
    }
    if (phone != null) {
      await _storage.write(key: _keyCandPhone, value: phone);
    }
    if (email != null) {
      await _storage.write(key: _keyCandEmail, value: email);
    }
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

    // Populate in-memory cache immediately
    _cachedAuthToken = token;
    _cachedUserRole = role.toUpperCase();
    _cachedAccountType =
        (accountType == 'ADMIN') ? AccountType.admin : AccountType.staff;

    // Sequential writes
    await _storage.write(key: _keyActiveAccountType, value: accountType);
    await _storage.write(key: _keyStaffToken, value: token);
    await _storage.write(key: _keyStaffId, value: staffId);
    await _storage.write(key: _keyStaffRole, value: role);
    await _storage.write(key: _keyStaffName, value: fullName);
    await _storage.write(key: _keyStaffEmail, value: email);
    await _storage.write(
      key: _keyStaffPermissions,
      value: permissions.join(','),
    );
  }

  /// Retrieves the active account type (CANDIDATE, STAFF, ADMIN, NONE)
  Future<AccountType> getActiveAccountType() async {
    if (_cachedAccountType != AccountType.none) {
      return _cachedAccountType;
    }
    final typeStr = await _storage.read(key: _keyActiveAccountType);
    switch (typeStr) {
      case 'CANDIDATE':
        _cachedAccountType = AccountType.candidate;
        return AccountType.candidate;
      case 'STAFF':
        _cachedAccountType = AccountType.staff;
        return AccountType.staff;
      case 'ADMIN':
        _cachedAccountType = AccountType.admin;
        return AccountType.admin;
      default:
        _cachedAccountType = AccountType.none;
        return AccountType.none;
    }
  }

  /// Retrieves the active authentication token based on currently active account
  Future<String?> getAuthToken() async {
    if (_cachedAuthToken != null && _cachedAuthToken!.isNotEmpty) {
      return _cachedAuthToken;
    }
    final activeType = await getActiveAccountType();
    if (activeType == AccountType.candidate) {
      final token = await _storage.read(key: _keyCandToken);
      _cachedAuthToken = token;
      return token;
    } else if (activeType == AccountType.staff ||
        activeType == AccountType.admin) {
      final token = await _storage.read(key: _keyStaffToken);
      _cachedAuthToken = token;
      return token;
    }
    return null;
  }

  /// Retrieves the active role name
  Future<String?> getUserRole() async {
    if (_cachedUserRole != null && _cachedUserRole!.isNotEmpty) {
      return _cachedUserRole;
    }
    final activeType = await getActiveAccountType();
    if (activeType == AccountType.candidate) {
      _cachedUserRole = 'CANDIDATE';
      return 'CANDIDATE';
    } else if (activeType == AccountType.staff ||
        activeType == AccountType.admin) {
      final role = await _storage.read(key: _keyStaffRole);
      _cachedUserRole = role;
      return role;
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
    _cachedAuthToken = null;
    _cachedUserRole = null;
    _cachedAccountType = AccountType.none;

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
    _cachedAuthToken = null;
    _cachedUserRole = null;
    _cachedAccountType = AccountType.none;

    await _storage.delete(key: _keyCandToken);
    await _storage.delete(key: _keyCandId);
    await _storage.delete(key: _keyCandNumber);
    await _storage.delete(key: _keyCandName);
    await _storage.delete(key: _keyCandPhone);
    await _storage.delete(key: _keyCandEmail);
  }

  /// Clears staff/admin stored session
  Future<void> clearStaffSession() async {
    _cachedAuthToken = null;
    _cachedUserRole = null;
    _cachedAccountType = AccountType.none;

    await _storage.delete(key: _keyStaffToken);
    await _storage.delete(key: _keyStaffId);
    await _storage.delete(key: _keyStaffRole);
    await _storage.delete(key: _keyStaffName);
    await _storage.delete(key: _keyStaffEmail);
    await _storage.delete(key: _keyStaffPermissions);
  }

  /// Clears all sessions and tokens (full wipe)
  Future<void> clearAll() async {
    _cachedAuthToken = null;
    _cachedUserRole = null;
    _cachedAccountType = AccountType.none;

    await clearCandidateSession();
    await clearStaffSession();
    await _storage.delete(key: _keyActiveAccountType);
  }
}
