import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure session and credential management backed by Android Keystore.
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

  static const String _keyAuthToken = 'sgr_secure_auth_token';
  static const String _keyUserRole = 'sgr_secure_user_role';
  static const String _keyUserId = 'sgr_secure_user_id';
  static const String _keyCandidateId = 'sgr_secure_candidate_id';
  static const String _keyApplicantNumber = 'sgr_secure_applicant_number';
  static const String _keyUserName = 'sgr_secure_user_name';

  Future<void> saveSession({
    required String token,
    required String role,
    required String userId,
    String? applicantNumber,
    String? userName,
  }) async {
    await Future.wait([
      _storage.write(key: _keyAuthToken, value: token),
      _storage.write(key: _keyUserRole, value: role),
      _storage.write(key: _keyUserId, value: userId),
      if (applicantNumber != null)
        _storage.write(key: _keyApplicantNumber, value: applicantNumber),
      if (userName != null)
        _storage.write(key: _keyUserName, value: userName),
    ]);
  }

  Future<String?> getAuthToken() async {
    return await _storage.read(key: _keyAuthToken);
  }

  Future<String?> getUserRole() async {
    return await _storage.read(key: _keyUserRole);
  }

  Future<String?> getUserId() async {
    return await _storage.read(key: _keyUserId);
  }

  Future<String?> getApplicantNumber() async {
    return await _storage.read(key: _keyApplicantNumber);
  }

  Future<String?> getUserName() async {
    return await _storage.read(key: _keyUserName);
  }

  Future<bool> hasValidSession() async {
    final token = await getAuthToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> clearSession() async {
    await Future.wait([
      _storage.delete(key: _keyAuthToken),
      _storage.delete(key: _keyUserRole),
      _storage.delete(key: _keyUserId),
      _storage.delete(key: _keyApplicantNumber),
      _storage.delete(key: _keyUserName),
    ]);
  }
}
