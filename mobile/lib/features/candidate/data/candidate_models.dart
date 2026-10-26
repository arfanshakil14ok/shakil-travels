/// Data models for Candidate Portal features (Profile, Jobs, Applications, Timeline, Documents, Finance)
library;

// ==============================================================================
// 1. DASHBOARD & PROFILE MODELS
// ==============================================================================

class CandidateProfileModel {
  final String id;
  final String applicantNumber;
  final String fullName;
  final String? fatherName;
  final String? motherName;
  final String? dateOfBirth;
  final String? gender;
  final String phone;
  final String? email;
  final String? nationality;
  final String? district;
  final String? upazila;
  final String? address;
  final String? permanentAddress;
  final String? emergencyContact;
  final String? education;
  final String? profession;
  final int yearsOfExperience;
  final String? skills;
  final String? languages;
  final bool passportAvailable;
  final String? passportNumber;
  final String? passportExpiry;
  final String? profilePhoto;
  final String status;
  final String? preferredCountryId;
  final String? preferredCountryName;
  final String? preferredCountryFlag;
  final String? preferredJobCategoryId;
  final String? preferredJobCategoryName;
  final int profileCompletion;
  final List<String> missingFields;

  const CandidateProfileModel({
    required this.id,
    required this.applicantNumber,
    required this.fullName,
    this.fatherName,
    this.motherName,
    this.dateOfBirth,
    this.gender,
    required this.phone,
    this.email,
    this.nationality,
    this.district,
    this.upazila,
    this.address,
    this.permanentAddress,
    this.emergencyContact,
    this.education,
    this.profession,
    this.yearsOfExperience = 0,
    this.skills,
    this.languages,
    this.passportAvailable = false,
    this.passportNumber,
    this.passportExpiry,
    this.profilePhoto,
    this.status = 'NEW',
    this.preferredCountryId,
    this.preferredCountryName,
    this.preferredCountryFlag,
    this.preferredJobCategoryId,
    this.preferredJobCategoryName,
    this.profileCompletion = 0,
    this.missingFields = const [],
  });

  factory CandidateProfileModel.fromJson(Map<String, dynamic> json) {
    final profile = json['profile'] as Map<String, dynamic>? ?? {};
    final country = json['preferredCountry'] as Map<String, dynamic>? ?? {};
    final category =
        json['preferredJobCategory'] as Map<String, dynamic>? ?? {};
    final completion = json['completion'] as Map<String, dynamic>? ?? {};

    int compPercent = 0;
    List<String> missing = [];
    if (completion.containsKey('percentage')) {
      compPercent = (completion['percentage'] as num?)?.toInt() ?? 0;
      if (completion['missingFields'] is List) {
        missing = (completion['missingFields'] as List)
            .map((e) => e.toString())
            .toList();
      }
    } else if (json.containsKey('profileCompletion')) {
      compPercent = (json['profileCompletion'] as num?)?.toInt() ?? 0;
    }

    return CandidateProfileModel(
      id: json['id']?.toString() ?? '',
      applicantNumber: json['applicantNumber']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      fatherName: json['fatherName']?.toString(),
      motherName: json['motherName']?.toString(),
      dateOfBirth: json['dateOfBirth']?.toString(),
      gender: json['gender']?.toString(),
      phone: json['phone']?.toString() ?? '',
      email: json['email']?.toString(),
      nationality: json['nationality']?.toString() ?? 'Bangladeshi',
      district: json['district']?.toString(),
      upazila: json['upazila']?.toString(),
      address:
          json['address']?.toString() ?? profile['currentAddress']?.toString(),
      permanentAddress: profile['permanentAddress']?.toString(),
      emergencyContact: profile['emergencyContact']?.toString(),
      education:
          json['education']?.toString() ?? profile['education']?.toString(),
      profession: json['profession']?.toString(),
      yearsOfExperience: (json['yearsOfExperience'] as num?)?.toInt() ??
          (profile['experienceYears'] as num?)?.toInt() ??
          0,
      skills: json['skills']?.toString() ?? profile['skills']?.toString(),
      languages: json['languages']?.toString(),
      passportAvailable: json['passportAvailable'] == true,
      passportNumber: json['passportNumber']?.toString(),
      passportExpiry: json['passportExpiry']?.toString(),
      profilePhoto: json['profilePhoto']?.toString(),
      status: json['status']?.toString() ?? 'NEW',
      preferredCountryId: country['id']?.toString(),
      preferredCountryName: country['name']?.toString(),
      preferredCountryFlag:
          country['flag']?.toString() ?? country['flagEmoji']?.toString(),
      preferredJobCategoryId: category['id']?.toString(),
      preferredJobCategoryName: category['name']?.toString(),
      profileCompletion: compPercent,
      missingFields: missing,
    );
  }

  Map<String, dynamic> toUpdateJson() {
    return {
      'fullName': fullName,
      if (fatherName != null) 'fatherName': fatherName,
      if (motherName != null) 'motherName': motherName,
      if (dateOfBirth != null) 'dateOfBirth': dateOfBirth,
      if (gender != null) 'gender': gender,
      if (nationality != null) 'nationality': nationality,
      if (district != null) 'district': district,
      if (upazila != null) 'upazila': upazila,
      if (address != null) 'address': address,
      if (permanentAddress != null) 'permanentAddress': permanentAddress,
      if (emergencyContact != null) 'emergencyContact': emergencyContact,
      if (education != null) 'education': education,
      if (profession != null) 'profession': profession,
      'yearsOfExperience': yearsOfExperience,
      if (skills != null) 'skills': skills,
      if (languages != null) 'languages': languages,
      'passportAvailable': passportAvailable,
      if (passportNumber != null) 'passportNumber': passportNumber,
      if (passportExpiry != null) 'passportExpiry': passportExpiry,
    };
  }
}

// ==============================================================================
// 2. APPLICATIONS & DEPLOYMENT TIMELINE MODELS
// ==============================================================================

class CandidateApplicationModel {
  final String id;
  final String applicationCode;
  final String status;
  final String effectiveStage;
  final String createdAt;
  final String? updatedAt;
  final String? jobTitle;
  final String? jobCode;
  final String? countryName;
  final String? countryFlag;
  final String? employerName;
  final double? salaryMin;
  final double? salaryMax;
  final String? currency;
  final String? processingCaseId;
  final String? processingCurrentStage;

  const CandidateApplicationModel({
    required this.id,
    required this.applicationCode,
    required this.status,
    required this.effectiveStage,
    required this.createdAt,
    this.updatedAt,
    this.jobTitle,
    this.jobCode,
    this.countryName,
    this.countryFlag,
    this.employerName,
    this.salaryMin,
    this.salaryMax,
    this.currency,
    this.processingCaseId,
    this.processingCurrentStage,
  });

  factory CandidateApplicationModel.fromJson(Map<String, dynamic> json) {
    final job = json['job'] as Map<String, dynamic>? ?? {};
    final country = job['country'] as Map<String, dynamic>? ?? {};
    final employer = job['employer'] as Map<String, dynamic>? ?? {};
    final pc = json['processingCase'] as Map<String, dynamic>? ?? {};

    return CandidateApplicationModel(
      id: json['id']?.toString() ?? '',
      applicationCode: json['applicationCode']?.toString() ?? '',
      status: json['status']?.toString() ?? 'NEW',
      effectiveStage: json['effectiveStage']?.toString() ??
          json['currentStage']?.toString() ??
          'APPLIED',
      createdAt: json['createdAt']?.toString() ?? '',
      updatedAt: json['updatedAt']?.toString(),
      jobTitle: job['title']?.toString(),
      jobCode: job['jobCode']?.toString(),
      countryName: country['name']?.toString(),
      countryFlag:
          country['flag']?.toString() ?? country['flagEmoji']?.toString(),
      employerName: employer['companyName']?.toString(),
      salaryMin: (job['salaryMin'] as num?)?.toDouble(),
      salaryMax: (job['salaryMax'] as num?)?.toDouble(),
      currency: job['currency']?.toString() ??
          job['salaryCurrency']?.toString() ??
          'BDT',
      processingCaseId: pc['id']?.toString(),
      processingCurrentStage: pc['currentStage']?.toString(),
    );
  }
}

class NextActionModel {
  final String title;
  final String titleBn;
  final String description;
  final String descriptionBn;
  final String
      actionType; // WAIT, UPLOAD_DOCS, ATTEND_MEDICAL, VIEW_TICKET, DEPARTURE_BRIEFING, CONFIRM_JOINING, COMPLETED

  const NextActionModel({
    required this.title,
    required this.titleBn,
    required this.description,
    required this.descriptionBn,
    required this.actionType,
  });

  factory NextActionModel.fromJson(Map<String, dynamic> json) {
    return NextActionModel(
      title: json['title']?.toString() ?? 'Processing',
      titleBn: json['titleBn']?.toString() ?? 'প্রক্রিয়াধীন',
      description: json['description']?.toString() ?? '',
      descriptionBn: json['descriptionBn']?.toString() ?? '',
      actionType: json['actionType']?.toString() ?? 'WAIT',
    );
  }
}

class DeploymentTimelineStageModel {
  final String key;
  final String label;
  final String labelBn;
  final String description;
  final String descriptionBn;
  final bool isCompleted;
  final bool isCurrent;
  final String? completedAt;

  const DeploymentTimelineStageModel({
    required this.key,
    required this.label,
    required this.labelBn,
    required this.description,
    required this.descriptionBn,
    required this.isCompleted,
    required this.isCurrent,
    this.completedAt,
  });
}

// ==============================================================================
// 3. OVERSEAS JOBS & FILTER MODELS
// ==============================================================================

class CountryFilterModel {
  final String id;
  final String name;
  final String code;
  final String? flag;

  const CountryFilterModel({
    required this.id,
    required this.name,
    required this.code,
    this.flag,
  });

  factory CountryFilterModel.fromJson(Map<String, dynamic> json) {
    return CountryFilterModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      flag: json['flag']?.toString() ?? json['flagEmoji']?.toString(),
    );
  }
}

class JobCategoryFilterModel {
  final String id;
  final String name;
  final String slug;

  const JobCategoryFilterModel({
    required this.id,
    required this.name,
    required this.slug,
  });

  factory JobCategoryFilterModel.fromJson(Map<String, dynamic> json) {
    return JobCategoryFilterModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
    );
  }
}

class JobCircularModel {
  final String id;
  final String jobCode;
  final String title;
  final String? description;
  final String countryName;
  final String? countryFlag;
  final String categoryName;
  final String? employerName;
  final int vacancies;
  final double? salaryMin;
  final double? salaryMax;
  final String currency;
  final String? skillsRequired;
  final int experienceYearsRequired;
  final String? dutyHours;
  final String? contractPeriod;
  final bool foodProvided;
  final bool accommodationProvided;
  final bool medicalProvided;
  final bool transportProvided;
  final String? deadline;
  final String status;
  final bool isFeatured;

  const JobCircularModel({
    required this.id,
    required this.jobCode,
    required this.title,
    this.description,
    required this.countryName,
    this.countryFlag,
    required this.categoryName,
    this.employerName,
    this.vacancies = 1,
    this.salaryMin,
    this.salaryMax,
    required this.currency,
    this.skillsRequired,
    this.experienceYearsRequired = 0,
    this.dutyHours,
    this.contractPeriod,
    this.foodProvided = false,
    this.accommodationProvided = false,
    this.medicalProvided = false,
    this.transportProvided = false,
    this.deadline,
    required this.status,
    this.isFeatured = false,
  });

  bool get isOpen => status == 'PUBLISHED' || status == 'ACTIVE';

  factory JobCircularModel.fromJson(Map<String, dynamic> json) {
    final country = json['country'] as Map<String, dynamic>? ?? {};
    final category = json['category'] as Map<String, dynamic>? ?? {};
    final employer = json['employer'] as Map<String, dynamic>? ?? {};

    return JobCircularModel(
      id: json['id']?.toString() ?? '',
      jobCode: json['jobCode']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString(),
      countryName: country['name']?.toString() ?? 'Overseas',
      countryFlag:
          country['flag']?.toString() ?? country['flagEmoji']?.toString(),
      categoryName: category['name']?.toString() ?? 'General',
      employerName: employer['companyName']?.toString(),
      vacancies: (json['vacancies'] as num?)?.toInt() ??
          (json['openings'] as num?)?.toInt() ??
          1,
      salaryMin: (json['salaryMin'] as num?)?.toDouble(),
      salaryMax: (json['salaryMax'] as num?)?.toDouble(),
      currency: json['currency']?.toString() ?? 'BDT',
      skillsRequired: json['skillsRequired']?.toString(),
      experienceYearsRequired:
          (json['experienceYearsRequired'] as num?)?.toInt() ?? 0,
      dutyHours:
          json['dutyHours']?.toString() ?? json['workingHours']?.toString(),
      contractPeriod: json['contractPeriod']?.toString() ?? '2 Years',
      foodProvided: json['foodProvided'] == true,
      accommodationProvided: json['accommodationProvided'] == true,
      medicalProvided: json['medicalProvided'] == true,
      transportProvided: json['transportProvided'] == true,
      deadline: json['deadline']?.toString(),
      status: json['status']?.toString() ?? 'PUBLISHED',
      isFeatured: json['isFeatured'] == true || json['featured'] == true,
    );
  }
}

// ==============================================================================
// 4. CANDIDATE DOCUMENTS & DOCUMENT TYPES
// ==============================================================================

class DocumentTypeModel {
  final String id;
  final String name;
  final String code; // PASSPORT, NID, PHOTO, MEDICAL, POLICE_CLEARANCE, etc.
  final bool isRequired;
  final String? description;

  const DocumentTypeModel({
    required this.id,
    required this.name,
    required this.code,
    this.isRequired = false,
    this.description,
  });

  factory DocumentTypeModel.fromJson(Map<String, dynamic> json) {
    return DocumentTypeModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      isRequired: json['isRequired'] == true,
      description: json['description']?.toString(),
    );
  }
}

class CandidateDocumentModel {
  final String id;
  final String fileName;
  final String? fileUrl;
  final int fileSize;
  final String mimeType;
  final String status; // UPLOADED, UNDER_REVIEW, VERIFIED, REJECTED, EXPIRED
  final String? rejectionReason;
  final String? expiryDate;
  final String? notes;
  final String createdAt;
  final DocumentTypeModel? documentType;

  const CandidateDocumentModel({
    required this.id,
    required this.fileName,
    this.fileUrl,
    required this.fileSize,
    required this.mimeType,
    required this.status,
    this.rejectionReason,
    this.expiryDate,
    this.notes,
    required this.createdAt,
    this.documentType,
  });

  bool get isVerified => status == 'VERIFIED';
  bool get isRejected => status == 'REJECTED';
  bool get isUnderReview => status == 'UNDER_REVIEW' || status == 'UPLOADED';

  factory CandidateDocumentModel.fromJson(Map<String, dynamic> json) {
    DocumentTypeModel? docType;
    if (json['documentType'] is Map<String, dynamic>) {
      docType = DocumentTypeModel.fromJson(json['documentType']);
    }

    return CandidateDocumentModel(
      id: json['id']?.toString() ?? '',
      fileName: json['fileName']?.toString() ?? 'Document',
      fileUrl: json['fileUrl']?.toString(),
      fileSize: (json['fileSize'] as num?)?.toInt() ?? 0,
      mimeType: json['mimeType']?.toString() ?? 'application/pdf',
      status: json['status']?.toString() ?? 'UPLOADED',
      rejectionReason: json['rejectionReason']?.toString(),
      expiryDate: json['expiryDate']?.toString(),
      notes: json['notes']?.toString(),
      createdAt: json['createdAt']?.toString() ?? '',
      documentType: docType,
    );
  }
}

// ==============================================================================
// 5. BILLING & FINANCIAL MODELS
// ==============================================================================

class InvoiceModel {
  final String id;
  final String invoiceNumber;
  final String invoiceDate;
  final String? dueDate;
  final double totalAmount;
  final double paidAmount;
  final double dueAmount;
  final String status; // PAID, PARTIALLY_PAID, ISSUED, OVERDUE, VOID
  final String? jobTitle;

  const InvoiceModel({
    required this.id,
    required this.invoiceNumber,
    required this.invoiceDate,
    this.dueDate,
    required this.totalAmount,
    required this.paidAmount,
    required this.dueAmount,
    required this.status,
    this.jobTitle,
  });

  bool get isPaid => status == 'PAID' || dueAmount <= 0;

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    final job = json['job'] as Map<String, dynamic>? ?? {};
    return InvoiceModel(
      id: json['id']?.toString() ?? '',
      invoiceNumber: json['invoiceNumber']?.toString() ?? '',
      invoiceDate: json['invoiceDate']?.toString() ?? '',
      dueDate: json['dueDate']?.toString(),
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      paidAmount: (json['paidAmount'] as num?)?.toDouble() ?? 0.0,
      dueAmount: (json['dueAmount'] as num?)?.toDouble() ?? 0.0,
      status: json['status']?.toString() ?? 'ISSUED',
      jobTitle: job['title']?.toString(),
    );
  }
}

class PaymentModel {
  final String id;
  final String paymentNumber;
  final String paymentDate;
  final double amount;
  final String paymentMethod; // CASH, BANK_TRANSFER, BKASH, MANUAL
  final String status; // COMPLETED, PENDING, REVERSED
  final String? invoiceNumber;
  final String? receiptNumber;

  const PaymentModel({
    required this.id,
    required this.paymentNumber,
    required this.paymentDate,
    required this.amount,
    required this.paymentMethod,
    required this.status,
    this.invoiceNumber,
    this.receiptNumber,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    final invoice = json['invoice'] as Map<String, dynamic>? ?? {};
    final receipts = json['receipts'] as List<dynamic>? ?? [];
    String? rNum;
    if (receipts.isNotEmpty && receipts[0] is Map) {
      rNum = receipts[0]['receiptNumber']?.toString();
    }

    return PaymentModel(
      id: json['id']?.toString() ?? '',
      paymentNumber: json['paymentNumber']?.toString() ?? '',
      paymentDate: json['paymentDate']?.toString() ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      paymentMethod: json['paymentMethod']?.toString() ?? 'MANUAL',
      status: json['status']?.toString() ?? 'COMPLETED',
      invoiceNumber: invoice['invoiceNumber']?.toString(),
      receiptNumber: rNum,
    );
  }
}

class CandidateFinanceSummaryModel {
  final double totalInvoiced;
  final double totalPaid;
  final double totalDue;
  final double runningBalance;
  final List<InvoiceModel> invoices;
  final List<PaymentModel> payments;

  const CandidateFinanceSummaryModel({
    required this.totalInvoiced,
    required this.totalPaid,
    required this.totalDue,
    required this.runningBalance,
    required this.invoices,
    required this.payments,
  });

  factory CandidateFinanceSummaryModel.fromJson(Map<String, dynamic> json) {
    final summary = json['summary'] as Map<String, dynamic>? ?? {};
    final invList = (json['invoices'] as List<dynamic>? ?? [])
        .map((i) => InvoiceModel.fromJson(i as Map<String, dynamic>))
        .toList();
    final payList = (json['payments'] as List<dynamic>? ?? [])
        .map((p) => PaymentModel.fromJson(p as Map<String, dynamic>))
        .toList();

    return CandidateFinanceSummaryModel(
      totalInvoiced: (summary['totalInvoiced'] as num?)?.toDouble() ?? 0.0,
      totalPaid: (summary['totalPaid'] as num?)?.toDouble() ?? 0.0,
      totalDue: (summary['totalDue'] as num?)?.toDouble() ?? 0.0,
      runningBalance: (summary['runningBalance'] as num?)?.toDouble() ?? 0.0,
      invoices: invList,
      payments: payList,
    );
  }
}
