import '../../../core/errors/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/safe_logger.dart';
import '../../../core/security/secure_storage.dart';
import 'session_model.dart';

/// Coordinates authentication requests, token persistence, and session lifecycle.
/// Strictly enforces candidate vs staff/admin isolation.
class AuthRepository {
  final ApiClient _apiClient;
  final SecureStorageService _secureStorage;

  AuthRepository({
    required ApiClient apiClient,
    SecureStorageService? secureStorage,
  })  : _apiClient = apiClient,
        _secureStorage = secureStorage ?? apiClient.secureStorage;

  SecureStorageService get secureStorage => _secureStorage;

  /// Authenticates a Candidate using phone / applicant number / email and password
  Future<SessionModel> loginCandidate({
    required String identifier,
    required String password,
  }) async {
    final cleanIdentifier = identifier.trim();
    if (cleanIdentifier.isEmpty) {
      throw const ApiException(
        message: 'Phone, Applicant ID, or Email is required',
      );
    }
    if (password.isEmpty) {
      throw const ApiException(message: 'Password is required');
    }

    final response = await _apiClient.post(
      ApiEndpoints.candidateLogin,
      data: {'identifier': cleanIdentifier, 'password': password},
    );

    if (response is! Map<String, dynamic> || response['success'] != true) {
      final errorMsg = response is Map ? response['error']?.toString() : null;
      throw ApiException(message: errorMsg ?? 'Candidate login failed');
    }

    final token = response['token']?.toString() ?? '';
    final data = (response['data'] as Map<String, dynamic>?) ?? {};
    final session = SessionModel.fromCandidateJson(data, token);

    await _secureStorage.saveCandidateSession(
      token: token,
      candidateId: session.userId,
      applicantNumber: session.applicantNumber,
      fullName: session.fullName,
      phone: session.phone,
      email: session.email,
    );

    SafeLogger.info(
      'Candidate session saved successfully for ID: ${session.applicantNumber}',
    );
    return session;
  }

  /// Authenticates Staff (Recruitment, Accounts, Processing)
  Future<SessionModel> loginStaff({
    required String email,
    required String password,
  }) async {
    final cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.isEmpty) {
      throw const ApiException(message: 'Work email is required');
    }
    if (password.isEmpty) {
      throw const ApiException(message: 'Password is required');
    }

    final response = await _apiClient.post(
      ApiEndpoints.staffLogin,
      data: {'email': cleanEmail, 'password': password},
    );

    if (response is! Map<String, dynamic> || response['success'] != true) {
      final errorMsg = response is Map ? response['error']?.toString() : null;
      throw ApiException(message: errorMsg ?? 'Staff authentication failed');
    }

    final token = response['token']?.toString() ?? '';
    final data = (response['data'] as Map<String, dynamic>?) ?? {};
    final session = SessionModel.fromStaffJson(data, token);

    await _secureStorage.saveStaffSession(
      token: token,
      staffId: session.userId,
      role: session.role,
      fullName: session.fullName ?? 'Staff Member',
      email: session.email ?? cleanEmail,
      permissions: session.permissions,
    );

    SafeLogger.info(
      'Staff session saved successfully for role: ${session.role}',
    );
    return session;
  }

  /// Authenticates Admin / Super Admin with portal isolation check
  Future<SessionModel> loginAdmin({
    required String email,
    required String password,
  }) async {
    final cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.isEmpty) {
      throw const ApiException(message: 'Admin email is required');
    }
    if (password.isEmpty) {
      throw const ApiException(message: 'Password is required');
    }

    final response = await _apiClient.post(
      ApiEndpoints.staffLogin,
      data: {
        'email': cleanEmail,
        'password': password,
        'portalType': 'ADMIN', // Enforces portal isolation on the server
      },
    );

    if (response is! Map<String, dynamic> || response['success'] != true) {
      final errorMsg = response is Map ? response['error']?.toString() : null;
      throw ApiException(
        message: errorMsg ?? 'Administrative authentication failed',
      );
    }

    final token = response['token']?.toString() ?? '';
    final data = (response['data'] as Map<String, dynamic>?) ?? {};
    final session = SessionModel.fromStaffJson(data, token);

    // Verify role returned by the server
    if (!session.isAdmin) {
      throw const ForbiddenException(
        message:
            'Access denied: Your account does not possess Administrative privileges.',
      );
    }

    await _secureStorage.saveStaffSession(
      token: token,
      staffId: session.userId,
      role: session.role,
      fullName: session.fullName ?? 'Administrator',
      email: session.email ?? cleanEmail,
      permissions: session.permissions,
    );

    SafeLogger.info(
      'Admin session verified and saved for: ${session.fullName}',
    );
    return session;
  }

  /// Restores session on app startup.
  /// Strictly preserves session during transient network failures.
  /// Only clears session on confirmed 401 Unauthorized / 403 Forbidden.
  Future<SessionModel?> restoreSession() async {
    final activeType = await _secureStorage.getActiveAccountType();
    if (activeType == AccountType.none) {
      return null;
    }

    final token = await _secureStorage.getAuthToken();
    if (token == null || token.isEmpty) {
      await _secureStorage.clearActiveSession();
      return null;
    }

    try {
      if (activeType == AccountType.candidate) {
        final profile = await _apiClient.get(ApiEndpoints.candidateMe);
        if (profile is Map<String, dynamic> && profile['success'] == true) {
          final data = (profile['data'] as Map<String, dynamic>?) ?? {};
          return SessionModel.fromCandidateJson(data, token);
        }
        return null;
      } else {
        final user = await _apiClient.get(ApiEndpoints.staffMe);
        if (user is Map<String, dynamic> && user['success'] == true) {
          final data = (user['data'] as Map<String, dynamic>?) ?? {};
          return SessionModel.fromStaffJson(data, token);
        }
        return null;
      }
    } on UnauthorizedException {
      // Confirmed token expiration / revocation
      SafeLogger.warn(
        'Stored session is invalid or expired (401). Clearing credentials.',
      );
      await _secureStorage.clearActiveSession();
      return null;
    } on ForbiddenException {
      SafeLogger.warn(
        'Stored session access denied (403). Clearing credentials.',
      );
      await _secureStorage.clearActiveSession();
      return null;
    } on NetworkException catch (e) {
      // NETWORK OUTAGE: Do NOT delete credentials!
      SafeLogger.warn(
        'Backend temporarily unreachable during session restore: ${e.message}',
      );
      // Return offline session from stored secure data so the user isn't falsely logged out
      if (activeType == AccountType.candidate) {
        final cand = await _secureStorage.getCandidateData();
        if (cand['id'] != null) {
          return SessionModel(
            token: token,
            role: 'CANDIDATE',
            userId: cand['id']!,
            applicantNumber: cand['applicantNumber'],
            fullName: cand['fullName'],
            phone: cand['phone'],
            email: cand['email'],
          );
        }
      } else {
        final staff = await _secureStorage.getStaffData();
        if (staff['id'] != null) {
          return SessionModel(
            token: token,
            role: staff['role']?.toString() ?? 'STAFF',
            userId: staff['id']!.toString(),
            fullName: staff['fullName']?.toString(),
            email: staff['email']?.toString(),
            permissions: (staff['permissions'] as List<dynamic>?)
                    ?.map((e) => e.toString())
                    .toList() ??
                [],
          );
        }
      }
      return null;
    } catch (e) {
      SafeLogger.error('Unexpected error validating session: $e');
      return null;
    }
  }

  /// Terminates the active session both remotely on the server and locally in Keystore
  Future<void> logout() async {
    final activeType = await _secureStorage.getActiveAccountType();
    try {
      if (activeType == AccountType.candidate) {
        await _apiClient.post(ApiEndpoints.candidateLogout);
      } else if (activeType == AccountType.staff ||
          activeType == AccountType.admin) {
        await _apiClient.post(ApiEndpoints.staffLogout);
      }
    } catch (e) {
      SafeLogger.warn(
        'Server logout notice failed (ignoring for local cleanup): $e',
      );
    } finally {
      await _secureStorage.clearActiveSession();
      SafeLogger.info('Local session successfully wiped.');
    }
  }
}
