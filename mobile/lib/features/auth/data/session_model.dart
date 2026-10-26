/// Authenticated user session representation.
/// Represents verified server response data for Candidate, Staff, and Admin roles.
class SessionModel {
  final String token;
  final String
      role; // CANDIDATE, RECRUITMENT_STAFF, ACCOUNTS_STAFF, ADMIN, SUPER_ADMIN
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

  bool get isCandidate => role == 'CANDIDATE';
  bool get isStaff => role != 'CANDIDATE';
  bool get isAdmin => role == 'ADMIN' || role == 'SUPER_ADMIN';
  bool get isSuperAdmin => role == 'SUPER_ADMIN';

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
      fullName: applicant['fullName']?.toString(),
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
      role: roleName,
      userId: user['id']?.toString() ?? '',
      fullName: user['name']?.toString() ?? user['fullName']?.toString(),
      email: user['email']?.toString(),
      phone: user['phone']?.toString(),
      permissions: perms,
    );
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
