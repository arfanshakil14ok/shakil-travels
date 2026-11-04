/// Authenticated user session representation.
/// Represents verified server response data for Candidate, Staff, and Admin roles.
class SessionModel {
  final String token;
  final String role; // CANDIDATE, RECRUITMENT_STAFF, ACCOUNTS_STAFF, ADMIN, SUPER_ADMIN
  final String userId;
  final String? applicantNumber;
  final String? fullName;
  final String? email;
  final String? phone;
  final List<String> permissions;

  const SessionModel({
    required this.token,
    required this.role,
    required this.userId,
    this.applicantNumber,
    this.fullName,
    this.email,
    this.phone,
    this.permissions = const [],
  });

  /// Authoritative system roles from the backend schema
  static const Set<String> knownRoles = {
    'CANDIDATE',
    'SUPER_ADMIN',
    'ADMIN',
    'RECRUITMENT_MANAGER',
    'RECRUITER',
    'DOCUMENT_OFFICER',
    'TRAINING_MANAGER',
    'FINANCE_OFFICER',
    'VISA_OFFICER',
    'SUPPORT_OFFICER',
    'RECRUITMENT_STAFF',
    'ACCOUNTS_STAFF',
    'CONTENT_MANAGER',
    'VIEWER',
    'STAFF',
  };

  bool get isCandidate => role.toUpperCase() == 'CANDIDATE';
  bool get isStaff => role.toUpperCase() != 'CANDIDATE';
  bool get isAdmin =>
      role.toUpperCase() == 'ADMIN' || role.toUpperCase() == 'SUPER_ADMIN';
  bool get isSuperAdmin => role.toUpperCase() == 'SUPER_ADMIN';
  bool get isStaffOnly => isStaff && !isAdmin;
  bool get isValidRole => knownRoles.contains(role.toUpperCase());

  bool hasPermission(String permissionCode) {
    if (isSuperAdmin) return true;
    return permissions.contains(permissionCode);
  }

  factory SessionModel.fromCandidateJson(
    Map<String, dynamic> json,
    String token,
  ) {
    final applicant = json['applicant'] as Map<String, dynamic>? ?? json;
    return SessionModel(
      token: token,
      role: 'CANDIDATE',
      userId: applicant['id']?.toString() ?? '',
      applicantNumber: applicant['applicantNumber']?.toString(),
      fullName: applicant['fullName']?.toString() ?? 'Candidate Member',
      email: applicant['email']?.toString(),
      phone: applicant['phone']?.toString(),
      permissions: const [],
    );
  }

  factory SessionModel.fromStaffJson(Map<String, dynamic> json, String token) {
    final user = json['user'] as Map<String, dynamic>? ?? json;
    final roleObj = user['role'];
    final roleName =
        (roleObj is Map ? roleObj['name'] : roleObj)?.toString() ?? 'STAFF';

    List<String> perms = [];
    if (json.containsKey('permissions') && json['permissions'] is List) {
      perms = (json['permissions'] as List).map((p) => p.toString()).toList();
    } else if (user.containsKey('permissions') && user['permissions'] is List) {
      perms = (user['permissions'] as List).map((p) => p.toString()).toList();
    }

    return SessionModel(
      token: token,
      role: roleName.toUpperCase(),
      userId: user['id']?.toString() ?? '',
      fullName: user['name']?.toString() ??
          user['fullName']?.toString() ??
          'Staff Member',
      email: user['email']?.toString(),
      phone: user['phone']?.toString(),
      permissions: perms,
    );
  }

  /// Parses the server response from the unified login endpoint (POST /api/portal/auth/login)
  /// Autonomously handles Candidate, Staff, and Admin identities based on server return.
  factory SessionModel.fromUnifiedJson(Map<String, dynamic> json) {
    final token = json['token']?.toString() ?? '';
    final userType = json['userType']?.toString().toUpperCase();
    final data = json['data'] as Map<String, dynamic>? ?? {};

    if (userType == 'STAFF' ||
        (json.containsKey('role') && json['role'] != 'CANDIDATE')) {
      final role = json['role']?.toString() ?? 'STAFF';
      final userData = (data['user'] as Map<String, dynamic>?) ??
          (data['applicant'] as Map<String, dynamic>?) ??
          data;

      List<String> perms = [];
      if (userData.containsKey('permissions') &&
          userData['permissions'] is List) {
        perms =
            (userData['permissions'] as List).map((p) => p.toString()).toList();
      } else if (json.containsKey('permissions') &&
          json['permissions'] is List) {
        perms =
            (json['permissions'] as List).map((p) => p.toString()).toList();
      }

      return SessionModel(
        token: token,
        role: role.toUpperCase(),
        userId: userData['id']?.toString() ?? '',
        fullName: userData['name']?.toString() ??
            userData['fullName']?.toString() ??
            'Staff Member',
        email: userData['email']?.toString(),
        phone: userData['phone']?.toString(),
        permissions: perms,
      );
    } else {
      final applicant = (data['applicant'] as Map<String, dynamic>?) ?? data;
      return SessionModel(
        token: token,
        role: 'CANDIDATE',
        userId: applicant['id']?.toString() ?? '',
        applicantNumber: applicant['applicantNumber']?.toString(),
        fullName: applicant['fullName']?.toString() ?? 'Candidate Member',
        email: applicant['email']?.toString(),
        phone: applicant['phone']?.toString(),
        permissions: const [],
      );
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'token': token,
      'role': role,
      'userId': userId,
      'applicantNumber': applicantNumber,
      'fullName': fullName,
      'email': email,
      'phone': phone,
      'permissions': permissions,
    };
  }
}
