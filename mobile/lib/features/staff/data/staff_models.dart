/// Data models for Staff & Admin Portal operations.
/// Strictly mapped to SHAKILWORK ERP PostgreSQL & Prisma schemas.
library;

// ==============================================================================
// 1. DASHBOARD & SYSTEM STATS MODELS
// ==============================================================================

class DashboardStaffStats {
  final int total;
  final int active;
  final int inactive;

  const DashboardStaffStats({
    required this.total,
    required this.active,
    required this.inactive,
  });

  factory DashboardStaffStats.fromJson(Map<String, dynamic> json) {
    return DashboardStaffStats(
      total: (json['total'] as num?)?.toInt() ?? 0,
      active: (json['active'] as num?)?.toInt() ?? 0,
      inactive: (json['inactive'] as num?)?.toInt() ?? 0,
    );
  }
}

class DashboardBusinessStats {
  final int applicants;
  final int activeApplicants;
  final int jobs;
  final int publishedJobs;
  final int employers;
  final int countries;
  final int applications;
  final int invoices;
  final double payments;
  final double dues;
  final int activeVisas;
  final int newInquiries;
  final int placements;

  const DashboardBusinessStats({
    required this.applicants,
    required this.activeApplicants,
    required this.jobs,
    required this.publishedJobs,
    required this.employers,
    required this.countries,
    required this.applications,
    required this.invoices,
    required this.payments,
    required this.dues,
    required this.activeVisas,
    required this.newInquiries,
    required this.placements,
  });

  factory DashboardBusinessStats.fromJson(Map<String, dynamic> json) {
    return DashboardBusinessStats(
      applicants: (json['applicants'] as num?)?.toInt() ?? 0,
      activeApplicants: (json['activeApplicants'] as num?)?.toInt() ?? 0,
      jobs: (json['jobs'] as num?)?.toInt() ?? 0,
      publishedJobs: (json['publishedJobs'] as num?)?.toInt() ?? 0,
      employers: (json['employers'] as num?)?.toInt() ?? 0,
      countries: (json['countries'] as num?)?.toInt() ?? 0,
      applications: (json['applications'] as num?)?.toInt() ?? 0,
      invoices: (json['invoices'] as num?)?.toInt() ?? 0,
      payments: (json['payments'] as num?)?.toDouble() ?? 0.0,
      dues: (json['dues'] as num?)?.toDouble() ?? 0.0,
      activeVisas: (json['activeVisas'] as num?)?.toInt() ?? 0,
      newInquiries: (json['newInquiries'] as num?)?.toInt() ?? 0,
      placements: (json['placements'] as num?)?.toInt() ?? 0,
    );
  }
}

class DashboardStatsModel {
  final DashboardStaffStats staff;
  final int notifications;
  final int totalAuditLogs;
  final List<StaffAuditLogModel> recentActivity;
  final DashboardBusinessStats business;

  const DashboardStatsModel({
    required this.staff,
    required this.notifications,
    required this.totalAuditLogs,
    required this.recentActivity,
    required this.business,
  });

  factory DashboardStatsModel.fromJson(Map<String, dynamic> json) {
    final staffJson = json['staff'] as Map<String, dynamic>? ?? {};
    final businessJson = json['business'] as Map<String, dynamic>? ?? {};
    final activityList = (json['recentActivity'] as List<dynamic>? ?? [])
        .map((a) => StaffAuditLogModel.fromJson(a as Map<String, dynamic>))
        .toList();

    return DashboardStatsModel(
      staff: DashboardStaffStats.fromJson(staffJson),
      notifications: (json['notifications'] as num?)?.toInt() ?? 0,
      totalAuditLogs: (json['totalAuditLogs'] as num?)?.toInt() ?? 0,
      recentActivity: activityList,
      business: DashboardBusinessStats.fromJson(businessJson),
    );
  }
}

// ==============================================================================
// 2. RECRUITMENT PROCESSING CASE MODELS (13-STAGE WORKFLOW)
// ==============================================================================

class StaffProcessingApplicantSummary {
  final String id;
  final String applicantNumber;
  final String fullName;
  final String phone;
  final String? passportNumber;
  final String? passportExpiry;
  final String? profilePhoto;
  final String? skills;

  const StaffProcessingApplicantSummary({
    required this.id,
    required this.applicantNumber,
    required this.fullName,
    required this.phone,
    this.passportNumber,
    this.passportExpiry,
    this.profilePhoto,
    this.skills,
  });

  String get maskedPassport {
    if (passportNumber == null || passportNumber!.length < 4) return '***';
    final len = passportNumber!.length;
    return '${passportNumber!.substring(0, 2)}***${passportNumber!.substring(len - 2)}';
  }

  factory StaffProcessingApplicantSummary.fromJson(Map<String, dynamic> json) {
    return StaffProcessingApplicantSummary(
      id: json['id']?.toString() ?? '',
      applicantNumber: json['applicantNumber']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      passportNumber: json['passportNumber']?.toString(),
      passportExpiry: json['passportExpiry']?.toString(),
      profilePhoto: json['profilePhoto']?.toString(),
      skills: json['skills']?.toString(),
    );
  }
}

class StaffProcessingCaseModel {
  final String id;
  final String processingCode;
  final String currentStage;
  final String overallStatus;
  final String priority;
  final String createdAt;
  final String? completedAt;
  final StaffProcessingApplicantSummary? applicant;
  final String? jobTitle;
  final String? jobCode;
  final String? countryName;
  final String? countryFlag;
  final String? employerName;
  final String? applicationCode;
  final String? medicalStatus;
  final String? visaStatus;
  final String? flightNumber;
  final String? departureDate;
  final String? smartCardNumber;

  const StaffProcessingCaseModel({
    required this.id,
    required this.processingCode,
    required this.currentStage,
    required this.overallStatus,
    this.priority = 'NORMAL',
    required this.createdAt,
    this.completedAt,
    this.applicant,
    this.jobTitle,
    this.jobCode,
    this.countryName,
    this.countryFlag,
    this.employerName,
    this.applicationCode,
    this.medicalStatus,
    this.visaStatus,
    this.flightNumber,
    this.departureDate,
    this.smartCardNumber,
  });

  bool get isCompleted =>
      currentStage == 'COMPLETED' || overallStatus == 'COMPLETED';
  bool get isOnHold => overallStatus == 'ON_HOLD';
  bool get isCancelled => overallStatus == 'CANCELLED';

  factory StaffProcessingCaseModel.fromJson(Map<String, dynamic> json) {
    final applicantJson = json['applicant'] as Map<String, dynamic>?;
    final job = json['job'] as Map<String, dynamic>? ?? {};
    final country = job['country'] as Map<String, dynamic>? ?? {};
    final employer = json['employer'] as Map<String, dynamic>? ?? {};
    final app = json['application'] as Map<String, dynamic>? ?? {};
    final med = json['medicalCase'] as Map<String, dynamic>? ?? {};
    final visa = json['visaCase'] as Map<String, dynamic>? ?? {};
    final ticket = json['travelTicket'] as Map<String, dynamic>? ?? {};
    final clearance = json['clearanceCase'] as Map<String, dynamic>? ?? {};

    return StaffProcessingCaseModel(
      id: json['id']?.toString() ?? '',
      processingCode: json['processingCode']?.toString() ?? '',
      currentStage: json['currentStage']?.toString() ?? 'SELECTED',
      overallStatus: json['overallStatus']?.toString() ?? 'ACTIVE',
      priority: json['priority']?.toString() ?? 'NORMAL',
      createdAt: json['createdAt']?.toString() ?? '',
      completedAt: json['completedAt']?.toString(),
      applicant: applicantJson != null
          ? StaffProcessingApplicantSummary.fromJson(applicantJson)
          : null,
      jobTitle: job['title']?.toString(),
      jobCode: job['jobCode']?.toString(),
      countryName: country['name']?.toString(),
      countryFlag: country['flag']?.toString(),
      employerName: employer['companyName']?.toString(),
      applicationCode: app['applicationCode']?.toString(),
      medicalStatus: med['status']?.toString(),
      visaStatus: visa['status']?.toString(),
      flightNumber: ticket['flightNumber']?.toString(),
      departureDate: ticket['departureDate']?.toString(),
      smartCardNumber: clearance['smartCardNumber']?.toString(),
    );
  }
}

// ==============================================================================
// 3. APPLICANT MANAGEMENT MODELS
// ==============================================================================

class StaffApplicantModel {
  final String id;
  final String applicantNumber;
  final String fullName;
  final String phone;
  final String? email;
  final String? passportNumber;
  final String? passportExpiry;
  final String? district;
  final String? upazila;
  final String status; // NEW, ACTIVE, IN_PROCESS, PLACED, REJECTED, ARCHIVED
  final String? profession;
  final int yearsOfExperience;
  final String? education;
  final String? countryName;
  final String? countryFlag;
  final String? categoryName;
  final String? assignedStaffName;
  final int notesCount;
  final int documentsCount;
  final int applicationsCount;

  const StaffApplicantModel({
    required this.id,
    required this.applicantNumber,
    required this.fullName,
    required this.phone,
    this.email,
    this.passportNumber,
    this.passportExpiry,
    this.district,
    this.upazila,
    this.status = 'NEW',
    this.profession,
    this.yearsOfExperience = 0,
    this.education,
    this.countryName,
    this.countryFlag,
    this.categoryName,
    this.assignedStaffName,
    this.notesCount = 0,
    this.documentsCount = 0,
    this.applicationsCount = 0,
  });

  /// Privacy masking: Masks middle digits of sensitive passport identifier
  String get maskedPassport {
    if (passportNumber == null || passportNumber!.isEmpty) {
      return 'Not Provided';
    }
    if (passportNumber!.length <= 4) return '***';
    final len = passportNumber!.length;
    return '${passportNumber!.substring(0, 2)}***${passportNumber!.substring(len - 2)}';
  }

  /// Privacy masking: Masks middle digits of candidate phone number
  String get maskedPhone {
    if (phone.length <= 6) return phone;
    return '${phone.substring(0, 4)}****${phone.substring(phone.length - 3)}';
  }

  factory StaffApplicantModel.fromJson(Map<String, dynamic> json) {
    final country = json['preferredCountry'] as Map<String, dynamic>? ?? {};
    final category =
        json['preferredJobCategory'] as Map<String, dynamic>? ?? {};
    final staff = json['assignedStaff'] as Map<String, dynamic>? ?? {};
    final count = json['_count'] as Map<String, dynamic>? ?? {};

    return StaffApplicantModel(
      id: json['id']?.toString() ?? '',
      applicantNumber: json['applicantNumber']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      email: json['email']?.toString(),
      passportNumber: json['passportNumber']?.toString(),
      passportExpiry: json['passportExpiry']?.toString(),
      district: json['district']?.toString(),
      upazila: json['upazila']?.toString(),
      status: json['status']?.toString() ?? 'NEW',
      profession: json['profession']?.toString(),
      yearsOfExperience: (json['yearsOfExperience'] as num?)?.toInt() ?? 0,
      education: json['education']?.toString(),
      countryName: country['name']?.toString(),
      countryFlag: country['flag']?.toString(),
      categoryName: category['name']?.toString(),
      assignedStaffName: staff['name']?.toString(),
      notesCount: (count['notes'] as num?)?.toInt() ?? 0,
      documentsCount: (count['documents'] as num?)?.toInt() ?? 0,
      applicationsCount: (count['applications'] as num?)?.toInt() ?? 0,
    );
  }
}

// ==============================================================================
// 4. DOCUMENT REVIEW & VERIFICATION MODELS
// ==============================================================================

class StaffDocumentModel {
  final String id;
  final String fileName;
  final int fileSize;
  final String mimeType;
  final String status; // UPLOADED, UNDER_REVIEW, VERIFIED, REJECTED
  final String? rejectionReason;
  final String? expiryDate;
  final String? notes;
  final String createdAt;
  final String? verifiedAt;
  final String? verifiedByName;
  final String? applicantId;
  final String? applicantName;
  final String? applicantNumber;
  final String? documentTypeName;
  final String? documentTypeCode;

  const StaffDocumentModel({
    required this.id,
    required this.fileName,
    required this.fileSize,
    required this.mimeType,
    required this.status,
    this.rejectionReason,
    this.expiryDate,
    this.notes,
    required this.createdAt,
    this.verifiedAt,
    this.verifiedByName,
    this.applicantId,
    this.applicantName,
    this.applicantNumber,
    this.documentTypeName,
    this.documentTypeCode,
  });

  bool get isVerified => status == 'VERIFIED';
  bool get isRejected => status == 'REJECTED';
  bool get isPendingReview => status == 'UNDER_REVIEW' || status == 'UPLOADED';

  factory StaffDocumentModel.fromJson(Map<String, dynamic> json) {
    final type = json['documentType'] as Map<String, dynamic>? ?? {};
    final applicant = json['applicant'] as Map<String, dynamic>? ?? {};
    final verifier = json['verifiedBy'] as Map<String, dynamic>? ?? {};

    return StaffDocumentModel(
      id: json['id']?.toString() ?? '',
      fileName: json['fileName']?.toString() ?? 'Document',
      fileSize: (json['fileSize'] as num?)?.toInt() ?? 0,
      mimeType: json['mimeType']?.toString() ?? 'application/pdf',
      status: json['status']?.toString() ?? 'UPLOADED',
      rejectionReason: json['rejectionReason']?.toString(),
      expiryDate: json['expiryDate']?.toString(),
      notes: json['notes']?.toString(),
      createdAt: json['createdAt']?.toString() ?? '',
      verifiedAt: json['verifiedAt']?.toString(),
      verifiedByName: verifier['name']?.toString(),
      applicantId: applicant['id']?.toString(),
      applicantName: applicant['fullName']?.toString(),
      applicantNumber: applicant['applicantNumber']?.toString(),
      documentTypeName: type['name']?.toString() ?? 'General Document',
      documentTypeCode: type['code']?.toString(),
    );
  }
}

// ==============================================================================
// 5. APPOINTMENTS & INTERVIEW MODELS
// ==============================================================================

class StaffInterviewModel {
  final String id;
  final String scheduledAt;
  final String interviewType; // IN_PERSON, ONLINE, EMPLOYER, TECHNICAL
  final String status; // SCHEDULED, COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED
  final String? location;
  final String? interviewerName;
  final String? applicantName;
  final String? applicantNumber;
  final String? applicantPhone;
  final String? jobTitle;
  final String? jobCode;
  final String? notes;

  const StaffInterviewModel({
    required this.id,
    required this.scheduledAt,
    required this.interviewType,
    required this.status,
    this.location,
    this.interviewerName,
    this.applicantName,
    this.applicantNumber,
    this.applicantPhone,
    this.jobTitle,
    this.jobCode,
    this.notes,
  });

  factory StaffInterviewModel.fromJson(Map<String, dynamic> json) {
    final applicant = json['applicant'] as Map<String, dynamic>? ?? {};
    final app = json['application'] as Map<String, dynamic>? ?? {};
    final job = (app['job'] as Map<String, dynamic>?) ??
        (json['job'] as Map<String, dynamic>?) ??
        {};

    return StaffInterviewModel(
      id: json['id']?.toString() ?? '',
      scheduledAt: json['scheduledAt']?.toString() ?? '',
      interviewType: json['interviewType']?.toString() ?? 'IN_PERSON',
      status: json['status']?.toString() ?? 'SCHEDULED',
      location: json['location']?.toString() ?? 'Shakil Travels Office, Dhaka',
      interviewerName: json['interviewerName']?.toString(),
      applicantName: applicant['fullName']?.toString(),
      applicantNumber: applicant['applicantNumber']?.toString(),
      applicantPhone: applicant['phone']?.toString(),
      jobTitle: job['title']?.toString(),
      jobCode: job['jobCode']?.toString(),
      notes: json['notes']?.toString(),
    );
  }
}

// ==============================================================================
// 6. AUDIT LOG & ACTIVITY TRAIL MODELS
// ==============================================================================

class StaffAuditLogModel {
  final String id;
  final String action;
  final String entity;
  final String actorType; // STAFF, CANDIDATE, SYSTEM, ADMIN
  final String? description;
  final String createdAt;
  final String? userName;
  final String? userEmail;
  final String? ipAddress;

  const StaffAuditLogModel({
    required this.id,
    required this.action,
    required this.entity,
    required this.actorType,
    this.description,
    required this.createdAt,
    this.userName,
    this.userEmail,
    this.ipAddress,
  });

  factory StaffAuditLogModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? {};

    return StaffAuditLogModel(
      id: json['id']?.toString() ?? '',
      action: json['action']?.toString() ?? '',
      entity: json['entity']?.toString() ?? '',
      actorType: json['actorType']?.toString() ?? 'STAFF',
      description: json['description']?.toString(),
      createdAt: json['createdAt']?.toString() ?? '',
      userName: user['name']?.toString() ?? json['actorName']?.toString(),
      userEmail: user['email']?.toString(),
      ipAddress: json['ipAddress']?.toString(),
    );
  }
}

// ==============================================================================
// 7. JOB DEMANDS & VACANCIES MANAGEMENT MODELS
// ==============================================================================

class StaffJobDemandModel {
  final String id;
  final String jobCode;
  final String title;
  final String countryName;
  final String? countryFlag;
  final String? employerName;
  final String categoryName;
  final int vacancies;
  final String status; // DRAFT, PUBLISHED, PAUSED, CLOSED, CANCELLED
  final double? salaryMin;
  final double? salaryMax;
  final String currency;
  final String? deadline;

  const StaffJobDemandModel({
    required this.id,
    required this.jobCode,
    required this.title,
    required this.countryName,
    this.countryFlag,
    this.employerName,
    required this.categoryName,
    this.vacancies = 1,
    required this.status,
    this.salaryMin,
    this.salaryMax,
    required this.currency,
    this.deadline,
  });

  bool get isPublished => status == 'PUBLISHED';
  bool get isDraft => status == 'DRAFT';
  bool get isClosed => status == 'CLOSED';

  factory StaffJobDemandModel.fromJson(Map<String, dynamic> json) {
    final country = json['country'] as Map<String, dynamic>? ?? {};
    final category = json['category'] as Map<String, dynamic>? ?? {};
    final employer = json['employer'] as Map<String, dynamic>? ?? {};

    return StaffJobDemandModel(
      id: json['id']?.toString() ?? '',
      jobCode: json['jobCode']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      countryName: country['name']?.toString() ?? 'Overseas',
      countryFlag: country['flag']?.toString(),
      employerName: employer['companyName']?.toString(),
      categoryName: category['name']?.toString() ?? 'General',
      vacancies: (json['vacancies'] as num?)?.toInt() ?? 1,
      status: json['status']?.toString() ?? 'DRAFT',
      salaryMin: (json['salaryMin'] as num?)?.toDouble(),
      salaryMax: (json['salaryMax'] as num?)?.toDouble(),
      currency: json['currency']?.toString() ?? 'BDT',
      deadline: json['deadline']?.toString(),
    );
  }
}
