import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/security/secure_storage.dart';
import 'session_model.dart';

class AuthRepository {
  final ApiClient _apiClient;
  final SecureStorageService _secureStorage;

  AuthRepository({
    required ApiClient apiClient,
    required SecureStorageService secureStorage,
  })  : _apiClient = apiClient,
        _secureStorage = secureStorage;

  /// Authenticates a candidate with phone / applicant number / email and password
  Future<SessionModel> loginCandidate({
    required String identifier,
    required String password,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.candidateLogin,
      data: {
        'identifier': identifier.trim(),
        'password': password,
      },
    );

    // The backend returns { success: true, token: "...", data: { applicant: {...} } }
    // Or if cookie-only, the interceptor handles token extraction
    final token = response['token']?.toString() ?? 'session_cookie_active';
    final data = (response['data'] as Map<String, dynamic>?) ?? {};
    final session = SessionModel.fromCandidateJson(data, token);

    await _secureStorage.saveSession(
      token: token,
      role: 'CANDIDATE',
      userId: session.userId,
      applicantNumber: session.applicantNumber,
      userName: session.fullName,
    );

    return session;
  }

  /// Authenticates staff or admin user
  Future<SessionModel> loginStaff({
    required String email,
    required String password,
    String? portalType,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.staffLogin,
      data: {
        'email': email.trim().toLowerCase(),
        'password': password,
        if (portalType != null) 'portalType': portalType,
      },
    );

    final token = response['token']?.toString() ?? 'session_cookie_active';
    final data = (response['data'] as Map<String, dynamic>?) ?? {};
    final session = SessionModel.fromStaffJson(data, token);

    await _secureStorage.saveSession(
      token: token,
      role: session.role,
      userId: session.userId,
      userName: session.fullName,
    );

    return session;
  }

  /// Restores existing session from Android Keystore
  Future<SessionModel?> restoreSession() async {
    final hasSession = await _secureStorage.hasValidSession();
    if (!hasSession) return null;

    final token = await _secureStorage.getAuthToken();
    final role = await _secureStorage.getUserRole();
    final userId = await _secureStorage.getUserId();
    final applicantNumber = await _secureStorage.getApplicantNumber();
    final userName = await _secureStorage.getUserName();

    if (token == null || role == null || userId == null) {
      await _secureStorage.clearSession();
      return null;
    }

    try {
      // Validate token with live backend
      if (role == 'CANDIDATE') {
        final profile = await _apiClient.get(ApiEndpoints.candidateMe);
        return SessionModel.fromCandidateJson(
          (profile['data'] as Map<String, dynamic>?) ?? {},
          token,
        );
      } else {
        final user = await _apiClient.get(ApiEndpoints.staffMe);
        return SessionModel.fromStaffJson(
          (user['data'] as Map<String, dynamic>?) ?? {},
          token,
        );
      }
    } catch (_) {
      // If validation fails due to 401, clear stored credentials
      await _secureStorage.clearSession();
      return null;
    }
  }

  /// Terminates authenticated session
  Future<void> logout() async {
    final role = await _secureStorage.getUserRole();
    try {
      if (role == 'CANDIDATE') {
        await _apiClient.post(ApiEndpoints.candidateLogout);
      } else {
        await _apiClient.post(ApiEndpoints.staffLogout);
      }
    } catch (_) {
      // Ignore network errors during logout
    } finally {
      await _secureStorage.clearSession();
    }
  }
}
