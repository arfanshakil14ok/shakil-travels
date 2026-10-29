import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/errors/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/safe_logger.dart';
import 'candidate_models.dart';

class CandidateRepository {
  final ApiClient _apiClient;

  CandidateRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  // ==============================================================================
  // 1. CANDIDATE PROFILE & DASHBOARD SUMMARY
  // ==============================================================================

  Future<CandidateProfileModel> getProfile() async {
    final response = await _apiClient.get(ApiEndpoints.candidateProfile);
    if (response is Map<String, dynamic> && response['success'] == true) {
      final data = (response['data'] as Map<String, dynamic>?) ?? {};
      return CandidateProfileModel.fromJson(data);
    }
    throw const ApiException(message: 'Failed to fetch candidate profile');
  }

  Future<CandidateProfileModel> updateProfile(
    CandidateProfileModel profile,
  ) async {
    final response = await _apiClient.put(
      ApiEndpoints.candidateProfile,
      data: profile.toUpdateJson(),
    );
    if (response is Map<String, dynamic> && response['success'] == true) {
      final data = (response['data'] as Map<String, dynamic>?) ?? {};
      return CandidateProfileModel.fromJson(data);
    }
    final errorMsg = response is Map ? response['error']?.toString() : null;
    throw ApiException(
      message: errorMsg ?? 'Failed to update candidate profile',
    );
  }

  // ==============================================================================
  // 2. MY APPLICATIONS & DEPLOYMENT TIMELINE
  // ==============================================================================

  Future<List<CandidateApplicationModel>> getMyApplications() async {
    final response = await _apiClient.get(ApiEndpoints.candidateApplications);
    if (response is Map<String, dynamic> && response['success'] == true) {
      final list = (response['data'] as List<dynamic>?) ?? [];
      return list
          .map(
            (item) => CandidateApplicationModel.fromJson(
              item as Map<String, dynamic>,
            ),
          )
          .toList();
    }
    return [];
  }

  Future<Map<String, dynamic>> getApplicationDetails(String id) async {
    final response = await _apiClient.get(
      '${ApiEndpoints.candidateApplications}/$id',
    );
    if (response is Map<String, dynamic> && response['success'] == true) {
      return (response['data'] as Map<String, dynamic>?) ?? {};
    }
    throw const ApiException(message: 'Failed to fetch application details');
  }

  Future<Map<String, dynamic>> getProcessingTimeline(
    String processingId,
  ) async {
    final response = await _apiClient.get(
      '/api/portal/processing/$processingId/timeline',
    );
    if (response is Map<String, dynamic> && response['success'] == true) {
      return (response['data'] as Map<String, dynamic>?) ?? {};
    }
    throw const ApiException(message: 'Failed to fetch processing timeline');
  }

  /// Official 13 Deployment Stages mapped from ERP State Machine & Timeline API
  static const List<Map<String, String>> official13Stages = [
    {
      'key': 'SELECTED',
      'label': 'File Opened / Selected',
      'labelBn': 'ফাইল খোলা / চূড়ান্ত নির্বাচন',
      'desc': 'Recruitment dossier initiated',
      'descBn': 'আপনার নিয়োগ ফাইল খোলা হয়েছে',
    },
    {
      'key': 'DOCUMENT_PROCESSING',
      'label': 'Document Submission',
      'labelBn': 'কাগজপত্র দাখিল',
      'desc': 'Passport and certificates submitted',
      'descBn': 'পাসপোর্ট ও প্রয়োজনীয় কাগজপত্র জমা দিন',
    },
    {
      'key': 'DOCUMENT_VERIFICATION',
      'label': 'Document Verification',
      'labelBn': 'ডকুমেন্ট ভেরিফিকেশন',
      'desc': 'Compliance team auditing documents',
      'descBn': 'কমপ্লায়েন্স টিম কর্তৃক কাগজপত্র যাচাই',
    },
    {
      'key': 'MEDICAL_SCHEDULED',
      'label': 'Medical Appointment',
      'labelBn': 'মেডিকেল অ্যাপয়েন্টমেন্ট',
      'desc': 'GAMCA accredited medical appointment',
      'descBn': 'অনুমোদিত গামকা মেডিকেল পরীক্ষা',
    },
    {
      'key': 'MEDICAL_PASSED',
      'label': 'Medical Fitness Cleared',
      'labelBn': 'মেডিকেল ফিটনেস উত্তীর্ণ',
      'desc': 'Clinical fitness confirmed',
      'descBn': 'স্বাস্থ্য ফিটনেস সনদপত্র প্রাপ্ত',
    },
    {
      'key': 'VISA_PREPARATION',
      'label': 'Visa Dossier Preparation',
      'labelBn': 'ভিসা ফাইল প্রস্তুতকরণ',
      'desc': 'Attestations and embassy papers compiled',
      'descBn': 'দূতাবাসের কাগজপত্র ও সত্যায়ন প্রস্তুত',
    },
    {
      'key': 'VISA_PROCESSING',
      'label': 'Visa in Embassy',
      'labelBn': 'দূতাবাসে ভিসা প্রসেসিং',
      'desc': 'Submitted to embassy for stamping',
      'descBn': 'ভিসা স্ট্যাম্পিংয়ের জন্য দূতাবাসে জমা',
    },
    {
      'key': 'VISA_APPROVED',
      'label': 'Visa Stamped & Approved',
      'labelBn': 'ভিসা অনুমোদিত ও স্ট্যাম্পড',
      'desc': 'Official employment visa issued',
      'descBn': 'সরকারি কর্মসংস্থান ভিসা অনুমোদিত',
    },
    {
      'key': 'CLEARANCE_PROCESSING',
      'label': 'BMET Emigration Processing',
      'labelBn': 'বিএমইটি ক্লিয়ারেন্স প্রসেসিং',
      'desc': 'Govt emigration clearance underway',
      'descBn': 'জনশক্তি ব্যুরোর বহির্গমন ছাড়পত্র প্রক্রিয়াধীন',
    },
    {
      'key': 'CLEARANCE_COMPLETED',
      'label': 'BMET Smart Card Ready',
      'labelBn': 'বিএমইটি স্মার্ট কার্ড সম্পন্ন',
      'desc': 'Smart card clearance issued',
      'descBn': 'স্মার্ট কার্ড ও ইমিগ্রেশন ক্লিয়ারেন্স প্রাপ্ত',
    },
    {
      'key': 'TICKET_ISSUED',
      'label': 'Air Ticket Confirmed',
      'labelBn': 'ফ্লাইটের টিকিট নিশ্চিত',
      'desc': 'Flight booking and itinerary confirmed',
      'descBn': 'বিমান টিকিট নিশ্চিত ও বুকিং সম্পন্ন',
    },
    {
      'key': 'DEPARTURE_READY',
      'label': 'Pre-Departure Briefing',
      'labelBn': 'প্রাক-যাত্রা ব্রিফিং ও প্রস্তুতি',
      'desc': 'Briefing and airport reporting scheduled',
      'descBn': 'ব্রিফিং ও বিমানবন্দরে রিপোর্টিং সম্পন্ন',
    },
    {
      'key': 'DEPARTED',
      'label': 'Departure & Overseas Joining',
      'labelBn': 'ফ্লাইট ও কর্মস্থলে যোগদান',
      'desc': 'Departed and reporting to employer',
      'descBn': 'সফল প্রবাসযাত্রা ও নিয়োগকর্তার অধীনে যোগদান',
    },
  ];

  // ==============================================================================
  // 3. OVERSEAS JOBS & CIRCULARS (WITH OFFLINE CACHE)
  // ==============================================================================

  static const String jobsCacheKey = 'cached_overseas_jobs';
  static const String countriesCacheKey = 'cached_countries';

  bool _isOfflineDataUsed = false;
  bool get isOfflineDataUsed => _isOfflineDataUsed;

  Future<List<JobCircularModel>> getJobs({
    String? search,
    String? countryId,
    String? categoryId,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
      if (countryId != null && countryId != 'ALL') 'countryId': countryId,
      if (categoryId != null && categoryId != 'ALL') 'categoryId': categoryId,
    };

    try {
      final response = await _apiClient.get(
        ApiEndpoints.jobs,
        queryParameters: queryParams,
      );

      if (response is Map<String, dynamic> && response['success'] == true) {
        final dynamic rawData = response['data'];
        final List<dynamic> list;
        if (rawData is List) {
          list = rawData;
        } else if (rawData is Map && rawData['items'] is List) {
          list = rawData['items'] as List<dynamic>;
        } else {
          list = [];
        }
        final jobs = list
            .map(
              (item) => JobCircularModel.fromJson(item as Map<String, dynamic>),
            )
            .toList();

        if ((search == null || search.isEmpty) &&
            (countryId == null || countryId == 'ALL') &&
            page == 1) {
          _saveJobsToCache(jobs);
        }
        _isOfflineDataUsed = false;
        return jobs;
      }
    } catch (_) {
      // Offline fallback: load cached jobs from local disk
      final cached = await _loadJobsFromCache();
      if (cached.isNotEmpty) {
        _isOfflineDataUsed = true;
        return cached.where((j) {
          if (countryId != null &&
              countryId != 'ALL' &&
              j.countryName.toLowerCase() != countryId.toLowerCase()) {
            return false;
          }
          if (search != null && search.trim().isNotEmpty) {
            final s = search.trim().toLowerCase();
            return j.title.toLowerCase().contains(s) ||
                j.countryName.toLowerCase().contains(s) ||
                (j.employerName != null &&
                    j.employerName!.toLowerCase().contains(s));
          }
          return true;
        }).toList();
      }
      rethrow;
    }
    return [];
  }

  Future<void> _saveJobsToCache(List<JobCircularModel> jobs) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final encoded = jsonEncode(jobs.map((j) => j.toJson()).toList());
      await prefs.setString(jobsCacheKey, encoded);
    } catch (_) {}
  }

  Future<List<JobCircularModel>> _loadJobsFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = prefs.getString(jobsCacheKey);
      if (jsonStr != null && jsonStr.isNotEmpty) {
        final decoded = jsonDecode(jsonStr) as List<dynamic>;
        return decoded
            .map((item) =>
                JobCircularModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {}
    return [];
  }

  Future<JobCircularModel> getJobDetails(String id) async {
    final response = await _apiClient.get('${ApiEndpoints.jobs}/$id');
    if (response is Map<String, dynamic> && response['success'] == true) {
      final dynamic raw = response['data'];
      final Map<String, dynamic> data = (raw is Map<String, dynamic>)
          ? raw
          : ((raw is Map) ? raw.cast<String, dynamic>() : {});
      return JobCircularModel.fromJson(data);
    }
    throw const ApiException(message: 'Failed to fetch job details');
  }

  Future<List<CountryFilterModel>> getCountries() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.countries);
      if (response is Map<String, dynamic> && response['success'] == true) {
        final list = (response['data'] as List<dynamic>?) ?? [];
        final countries = list
            .map(
              (item) =>
                  CountryFilterModel.fromJson(item as Map<String, dynamic>),
            )
            .toList();
        if (countries.isNotEmpty) {
          _saveCountriesToCache(countries);
        }
        return countries;
      }
    } catch (_) {}
    return _loadCountriesFromCache();
  }

  Future<void> _saveCountriesToCache(List<CountryFilterModel> countries) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final encoded = jsonEncode(countries.map((c) => c.toJson()).toList());
      await prefs.setString(countriesCacheKey, encoded);
    } catch (_) {}
  }

  Future<List<CountryFilterModel>> _loadCountriesFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = prefs.getString(countriesCacheKey);
      if (jsonStr != null && jsonStr.isNotEmpty) {
        final decoded = jsonDecode(jsonStr) as List<dynamic>;
        return decoded
            .map((item) =>
                CountryFilterModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {}
    return [];
  }

  Future<List<JobCategoryFilterModel>> getCategories() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.categories);
      if (response is Map<String, dynamic> && response['success'] == true) {
        final list = (response['data'] as List<dynamic>?) ?? [];
        return list
            .map(
              (item) =>
                  JobCategoryFilterModel.fromJson(item as Map<String, dynamic>),
            )
            .toList();
      }
    } catch (_) {}
    return [];
  }

  Future<Map<String, dynamic>> applyForJob(String jobId) async {
    final response = await _apiClient.post('/api/portal/jobs/$jobId/apply');
    if (response is Map<String, dynamic> && response['success'] == true) {
      return response;
    }
    final errorMsg = response is Map ? response['error']?.toString() : null;
    throw ApiException(message: errorMsg ?? 'Application failed');
  }

  // ==============================================================================
  // 4. CANDIDATE DOCUMENTS & UPLOAD
  // ==============================================================================

  Future<Map<String, dynamic>> getDocuments() async {
    final response = await _apiClient.get(ApiEndpoints.candidateDocuments);
    if (response is Map<String, dynamic> && response['success'] == true) {
      final data = (response['data'] as Map<String, dynamic>?) ?? {};
      final docs = (data['documents'] as List<dynamic>? ?? [])
          .map(
            (d) => CandidateDocumentModel.fromJson(d as Map<String, dynamic>),
          )
          .toList();
      final types = (data['documentTypes'] as List<dynamic>? ?? [])
          .map((t) => DocumentTypeModel.fromJson(t as Map<String, dynamic>))
          .toList();

      return {'documents': docs, 'documentTypes': types};
    }
    return {
      'documents': <CandidateDocumentModel>[],
      'documentTypes': <DocumentTypeModel>[],
    };
  }

  Future<bool> uploadDocument({
    required String documentTypeId,
    required String filePath,
    required String fileName,
    String? notes,
    String? passportNumber,
    String? expiryDate,
    ProgressCallback? onProgress,
  }) async {
    final file = File(filePath);
    if (!file.existsSync()) {
      throw const ApiException(
        message: 'Selected file does not exist on device.',
      );
    }

    final fileSize = await file.length();
    if (fileSize > 10 * 1024 * 1024) {
      throw const ApiException(
        message: 'File size exceeds maximum allowed 10MB limit.',
      );
    }

    final ext = fileName.toLowerCase().split('.').last;
    if (!['pdf', 'jpg', 'jpeg', 'png', 'webp'].contains(ext)) {
      throw const ApiException(
        message: 'Invalid file format. Allowed formats: PDF, JPG, PNG, WEBP.',
      );
    }

    final formData = FormData.fromMap({
      'documentTypeId': documentTypeId,
      if (notes != null) 'notes': notes,
      if (passportNumber != null) 'passportNumber': passportNumber,
      if (expiryDate != null) 'expiryDate': expiryDate,
      'file': await MultipartFile.fromFile(filePath, filename: fileName),
    });

    final response = await _apiClient.uploadMultipart(
      ApiEndpoints.candidateDocuments,
      formData: formData,
      onSendProgress: onProgress,
    );

    if (response is Map<String, dynamic> && response['success'] == true) {
      SafeLogger.info('Document uploaded successfully: $fileName');
      return true;
    }

    final errorMsg = response is Map ? response['error']?.toString() : null;
    throw ApiException(message: errorMsg ?? 'Document upload failed.');
  }

  // ==============================================================================
  // 5. BILLING STATEMENTS & PAYMENT HISTORY
  // ==============================================================================

  Future<CandidateFinanceSummaryModel> getFinanceSummary() async {
    final response = await _apiClient.get(ApiEndpoints.candidateFinance);
    if (response is Map<String, dynamic> && response['success'] == true) {
      final data = (response['data'] as Map<String, dynamic>?) ?? {};
      return CandidateFinanceSummaryModel.fromJson(data);
    }
    throw const ApiException(message: 'Failed to fetch financial statement');
  }
}
