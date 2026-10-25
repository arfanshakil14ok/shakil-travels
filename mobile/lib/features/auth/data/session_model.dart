/// Authenticated user session representation
class SessionModel {
  final String token;
  final String role; // CANDIDATE, RECRUITMENT_STAFF, ACCOUNTS_STAFF, ADMIN, SUPER_ADMIN
  final String userId;
  final String? applicantNumber;
  final String? fullName;
  final String? email;
  final String? phone;

  const SessionModel({
    required this.token,
    required this.role,
    required this.userId,
    this.applicantNumber,
    this.fullName,
    this.email,
    this.phone,
  });

  bool get isCandidate => role == 'CANDIDATE';
  bool get isStaff => role != 'CANDIDATE';
  bool get isAdmin => role == 'ADMIN' || role == 'SUPER_ADMIN';

  factory SessionModel.fromCandidateJson(Map<String, dynamic> json, String token) {
    final applicant = json['applicant'] as Map<String, dynamic>? ?? json;
    return SessionModel(
      token: token,
      role: 'CANDIDATE',
      userId: applicant['id']?.toString() ?? '',
      applicantNumber: applicant['applicantNumber']?.toString(),
      fullName: applicant['fullName']?.toString(),
      email: applicant['email']?.toString(),
      phone: applicant['phone']?.toString(),
    );
  }

  factory SessionModel.fromStaffJson(Map<String, dynamic> json, String token) {
    final user = json['user'] as Map<String, dynamic>? ?? json;
    final roleObj = user['role'];
    final roleName = (roleObj is Map ? roleObj['name'] : roleObj)?.toString() ?? 'STAFF';

    return SessionModel(
      token: token,
      role: roleName,
      userId: user['id']?.toString() ?? '',
      fullName: user['name']?.toString(),
      email: user['email']?.toString(),
      phone: user['phone']?.toString(),
    );
  }
}
