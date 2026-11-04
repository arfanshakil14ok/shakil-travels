import '../../../core/errors/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/safe_logger.dart';
import 'staff_models.dart';

class StaffRepository {
  final ApiClient _apiClient;

  StaffRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  // ==============================================================================
  // 1. DASHBOARD & EXECUTIVE STATS
  // ==============================================================================

  Future<DashboardStatsModel> getDashboardStats({bool refresh = false}) async {
    final response = await _apiClient.get(
      ApiEndpoints.dashboardStats,
      queryParameters: refresh ? {'refresh': 'true'} : null,
    );

    if (response is Map<String, dynamic> && response['success'] == true) {
      final data = response['data'] as Map<String, dynamic>? ?? {};
      return DashboardStatsModel.fromJson(data);
    }

    final errorMsg = response is Map ? response['error']?.toString() : null;
    throw ApiException(
      message: errorMsg ?? 'Failed to load dashboard statistics.',
    );
  }

  // ==============================================================================
  // 2. RECRUITMENT CASES & 13-STAGE STATE MACHINE TRANSITIONS
  // ==============================================================================

  Future<Map<String, dynamic>> getProcessingCases({
    String? search,
    String? stage,
    String? queue,
    String? assignedOfficerId,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
      if (stage != null && stage != 'ALL') 'stage': stage,
      if (queue != null && queue != 'ALL') 'queue': queue,
      if (assignedOfficerId != null && assignedOfficerId != 'ALL')
        'assignedOfficerId': assignedOfficerId,
    };

    final response = await _apiClient.get(
      ApiEndpoints.staffProcessing,
      queryParameters: queryParams,
    );

    if (response is Map<String, dynamic> && response['success'] == true) {
      final data = response['data'] as Map<String, dynamic>? ?? {};
      final rawItems = (data['cases'] as List<dynamic>? ?? []);
      final cases = rawItems
          .map(
            (c) => StaffProcessingCaseModel.fromJson(c as Map<String, dynamic>),
          )
          .toList();

      final pagination = data['pagination'] as Map<String, dynamic>? ?? {};
      return {
        'cases': cases,
        'total': (pagination['total'] as num?)?.toInt() ?? cases.length,
        'totalPages': (pagination['totalPages'] as num?)?.toInt() ?? 1,
        'stageCounts':
            (data['summary']?['stageCounts'] as Map<String, dynamic>?) ?? {},
      };
    }

    return {
      'cases': <StaffProcessingCaseModel>[],
      'total': 0,
      'totalPages': 1,
      'stageCounts': <String, dynamic>{},
    };
  }

  Future<Map<String, dynamic>> getProcessingCaseDetails(String id) async {
    final response = await _apiClient.get(ApiEndpoints.caseDetails(id));
    if (response is Map<String, dynamic> && response['success'] == true) {
      return (response['data'] as Map<String, dynamic>?) ?? {};
    }
    final errorMsg = response is Map ? response['error']?.toString() : null;
    throw ApiException(
      message: errorMsg ?? 'Failed to load recruitment case details.',
    );
  }

  Future<Map<String, dynamic>> transitionCase({
    required String caseId,
    required String targetStage,
    String? notes,
    bool forceOverride = false,
    String? overrideReason,
  }) async {
    final payload = {
      'targetStage': targetStage,
      if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
      'forceOverride': forceOverride,
      if (overrideReason != null && overrideReason.trim().isNotEmpty)
        'overrideReason': overrideReason.trim(),
    };

    final response = await _apiClient.post(
      ApiEndpoints.transitionCase(caseId),
      data: payload,
    );

    if (response is Map<String, dynamic> && response['success'] == true) {
      SafeLogger.info(
        'Successfully transitioned case $caseId to stage $targetStage',
      );
      return response;
    }

    // Gate check failure or validation errors
    if (response is Map<String, dynamic>) {
      final blockers = response['blockers'] as List<dynamic>?;
      if (blockers != null && blockers.isNotEmpty) {
        final reason = response['error'] ?? 'Stage gate requirements not met';
        throw ApiException(message: '$reason: ${blockers.join(", ")}');
      }
      final errorMsg = response['error']?.toString();
      throw ApiException(
        message: errorMsg ?? 'Stage transition rejected by server.',
      );
    }

    throw const ApiException(message: 'Stage transition failed.');
  }

  // ==============================================================================
  // 3. APPLICANT MANAGEMENT & NOTES
  // ==============================================================================

  Future<Map<String, dynamic>> getApplicants({
    String? search,
    String? status,
    String? countryId,
    String? categoryId,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
      if (status != null && status != 'ALL') 'status': status,
      if (countryId != null && countryId != 'ALL') 'countryId': countryId,
      if (categoryId != null && categoryId != 'ALL') 'categoryId': categoryId,
    };

    final response = await _apiClient.get(
      ApiEndpoints.staffApplicants,
      queryParameters: queryParams,
    );

    if (response is Map<String, dynamic> && response['success'] == true) {
      final data = response['data'] as Map<String, dynamic>? ?? {};
      final rawItems = (data['items'] as List<dynamic>? ?? []);
      final applicants = rawItems
          .map((a) => StaffApplicantModel.fromJson(a as Map<String, dynamic>))
          .toList();

      final pagination = data['pagination'] as Map<String, dynamic>? ?? {};
      return {
        'applicants': applicants,
        'total': (pagination['total'] as num?)?.toInt() ?? applicants.length,
        'totalPages': (pagination['totalPages'] as num?)?.toInt() ?? 1,
      };
    }

    return {'applicants': <StaffApplicantModel>[], 'total': 0, 'totalPages': 1};
  }

  Future<Map<String, dynamic>> getApplicantDetails(String id) async {
    final response = await _apiClient.get(ApiEndpoints.applicantDetails(id));
    if (response is Map<String, dynamic> && response['success'] == true) {
      return (response['data'] as Map<String, dynamic>?) ?? {};
    }
    final errorMsg = response is Map ? response['error']?.toString() : null;
    throw ApiException(
      message: errorMsg ?? 'Failed to load applicant dossier.',
    );
  }

  Future<bool> addApplicantNote({
    required String applicantId,
    required String content,
    String noteType = 'GENERAL',
    bool isInternal = true,
  }) async {
    final payload = {
      'content': content.trim(),
      'noteType': noteType,
      'isInternal': isInternal,
    };

    final response = await _apiClient.post(
      ApiEndpoints.applicantNotes(applicantId),
      data: payload,
    );

    if (response is Map<String, dynamic> && response['success'] == true) {
      return true;
    }

    final errorMsg = response is Map ? response['error']?.toString() : null;
    throw ApiException(message: errorMsg ?? 'Failed to record staff note.');
  }

  // ==============================================================================
  // 4. DOCUMENT REVIEW & VERIFICATION
  // ==============================================================================

  Future<bool> verifyDocument({
    required String documentId,
    required String status, // VERIFIED or REJECTED
    String? rejectionReason,
  }) async {
    final payload = {
      'status': status,
      if (rejectionReason != null && rejectionReason.trim().isNotEmpty)
        'rejectionReason': rejectionReason.trim(),
    };

    final response = await _apiClient.post(
      ApiEndpoints.verifyDocument(documentId),
      data: payload,
    );

    if (response is Map<String, dynamic> && response['success'] == true) {
      SafeLogger.info('Document $documentId decision persisted: $status');
      return true;
    }

    final errorMsg = response is Map ? response['error']?.toString() : null;
    throw ApiException(
      message: errorMsg ?? 'Document verification update failed.',
    );
  }

  // ==============================================================================
  // 5. INTERVIEWS & APPOINTMENT SCHEDULES
  // ==============================================================================

  Future<List<StaffInterviewModel>> getInterviews({
    String? search,
    String? status,
    String? type,
  }) async {
    final queryParams = <String, dynamic>{
      if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
      if (status != null && status != 'ALL') 'status': status,
      if (type != null && type != 'ALL') 'type': type,
    };

    final response = await _apiClient.get(
      ApiEndpoints.interviews,
      queryParameters: queryParams,
    );

    if (response is Map<String, dynamic> && response['success'] == true) {
      final list = (response['data'] as List<dynamic>? ?? []);
      return list
          .map(
            (item) =>
                StaffInterviewModel.fromJson(item as Map<String, dynamic>),
          )
          .toList();
    }
    return [];
  }

  // ==============================================================================
  // 6. AUDIT LOGS & OVERSIGHT TRAIL (ADMIN / SUPER ADMIN)
  // ==============================================================================

  Future<Map<String, dynamic>> getAuditLogs({
    String? search,
    String? action,
    String? entity,
    int page = 1,
    int pageSize = 25,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'pageSize': pageSize,
      if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
      if (action != null && action != 'ALL') 'action': action,
      if (entity != null && entity != 'ALL') 'entity': entity,
    };

    final response = await _apiClient.get(
      ApiEndpoints.auditLogs,
      queryParameters: queryParams,
    );

    if (response is Map<String, dynamic> && response['success'] == true) {
      final data = response['data'] as Map<String, dynamic>? ?? {};
      final rawItems = (data['items'] as List<dynamic>? ?? []);
      final logs = rawItems
          .map((l) => StaffAuditLogModel.fromJson(l as Map<String, dynamic>))
          .toList();

      final pagination = data['pagination'] as Map<String, dynamic>? ?? {};
      return {
        'logs': logs,
        'total': (pagination['total'] as num?)?.toInt() ?? logs.length,
        'totalPages': (pagination['totalPages'] as num?)?.toInt() ?? 1,
      };
    }

    return {'logs': <StaffAuditLogModel>[], 'total': 0, 'totalPages': 1};
  }

  // ==============================================================================
  // 7. JOB DEMAND MANAGEMENT (ADMIN & STAFF)
  // ==============================================================================

  Future<List<StaffJobDemandModel>> getJobDemands({
    String? search,
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
      if (status != null && status != 'ALL') 'status': status,
    };

    final response = await _apiClient.get(
      ApiEndpoints.jobs,
      queryParameters: queryParams,
    );

    if (response is Map<String, dynamic> && response['success'] == true) {
      final list = (response['data'] as List<dynamic>? ?? []);
      return list
          .map(
            (item) =>
                StaffJobDemandModel.fromJson(item as Map<String, dynamic>),
          )
          .toList();
    }
    return [];
  }
}
