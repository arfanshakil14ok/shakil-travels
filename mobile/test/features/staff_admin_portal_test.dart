import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shakil_travels/core/config/app_config.dart';
import 'package:shakil_travels/core/errors/api_exception.dart';
import 'package:shakil_travels/core/network/api_client.dart';
import 'package:shakil_travels/core/network/api_endpoints.dart';
import 'package:shakil_travels/features/auth/data/session_model.dart';
import 'package:shakil_travels/features/staff/data/staff_models.dart';
import 'package:shakil_travels/features/staff/data/staff_repository.dart';

class MockHttpAdapter implements HttpClientAdapter {
  late ResponseBody Function(RequestOptions options) handler;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return handler(options);
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  group('Phase 4: Staff Portal, Operations & Admin Dashboard Tests', () {
    late ApiClient apiClient;
    late MockHttpAdapter mockAdapter;
    late StaffRepository repository;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      mockAdapter = MockHttpAdapter();
      final dio = Dio(
        BaseOptions(
          baseUrl: AppConfig.baseUrl,
          connectTimeout: AppConfig.connectTimeout,
          receiveTimeout: AppConfig.receiveTimeout,
        ),
      );
      dio.httpClientAdapter = mockAdapter;
      apiClient = ApiClient(dio: dio);
      repository = StaffRepository(apiClient: apiClient);
    });

    // =========================================================================
    // 1. Session & RBAC Permissions in Mobile Model
    // =========================================================================
    group('SessionModel RBAC Logic', () {
      test('Identifies roles and verifies permissions correctly', () {
        const recruiterSession = SessionModel(
          token: 'staff_jwt_token',
          role: 'RECRUITER',
          userId: 'u_recruiter_1',
          fullName: 'Tanvir Hossain',
          permissions: ['APPLICANT_VIEW', 'APPLICATION_VIEW', 'INTERVIEW_VIEW'],
        );

        expect(recruiterSession.isStaff, isTrue);
        expect(recruiterSession.isAdmin, isFalse);
        expect(recruiterSession.isSuperAdmin, isFalse);
        expect(recruiterSession.isCandidate, isFalse);
        expect(recruiterSession.hasPermission('APPLICANT_VIEW'), isTrue);
        expect(recruiterSession.hasPermission('DOCUMENT_VERIFY'), isFalse);

        const superAdminSession = SessionModel(
          token: 'super_admin_jwt',
          role: 'SUPER_ADMIN',
          userId: 'u_super_1',
          fullName: 'Managing Director',
          permissions: [], // empty list because super admin has universal access
        );

        expect(superAdminSession.isStaff, isTrue);
        expect(superAdminSession.isAdmin, isTrue);
        expect(superAdminSession.isSuperAdmin, isTrue);
        // Universal permission pass
        expect(superAdminSession.hasPermission('ANY_PERMISSION_CODE'), isTrue);
        expect(superAdminSession.hasPermission('SETTINGS_MANAGE'), isTrue);
      });
    });

    // =========================================================================
    // 2. Dashboard Stats & Operational Metrics
    // =========================================================================
    group('Staff & Admin Dashboard Statistics', () {
      test(
        'getDashboardStats() parses complete ERP statistics response',
        () async {
          mockAdapter.handler = (options) {
            expect(options.path, ApiEndpoints.dashboardStats);
            final body = jsonEncode({
              'success': true,
              'data': {
                'staff': {'total': 18, 'active': 16, 'inactive': 2},
                'notifications': 3,
                'totalAuditLogs': 1420,
                'recentActivity': [
                  {
                    'id': 'log_1',
                    'action': 'DOCUMENT_VERIFY',
                    'entity': 'DOCUMENT',
                    'actorType': 'STAFF',
                    'description': 'Passport verified for applicant CAN-0012',
                    'createdAt': '2026-10-25T14:30:00.000Z',
                    'user': {
                      'name': 'Document Auditor',
                      'email': 'auditor@shakiltravels.com',
                    },
                  },
                ],
                'business': {
                  'applicants': 450,
                  'activeApplicants': 380,
                  'jobs': 35,
                  'publishedJobs': 24,
                  'employers': 15,
                  'countries': 8,
                  'applications': 120,
                  'invoices': 85,
                  'payments': 18500000.0,
                  'dues': 4200000.0,
                  'activeVisas': 42,
                  'newInquiries': 19,
                  'placements': 210,
                },
              },
            });
            return ResponseBody.fromString(
              body,
              200,
              headers: {
                Headers.contentTypeHeader: [Headers.jsonContentType],
              },
            );
          };

          final stats = await repository.getDashboardStats();
          expect(stats.staff.total, 18);
          expect(stats.staff.active, 16);
          expect(stats.business.applicants, 450);
          expect(stats.business.publishedJobs, 24);
          expect(stats.business.payments, 18500000.0);
          expect(stats.business.activeVisas, 42);
          expect(stats.recentActivity.length, 1);
          expect(stats.recentActivity.first.action, 'DOCUMENT_VERIFY');
        },
      );
    });

    // =========================================================================
    // 3. Recruitment Cases & 13-Stage Workflow Gate Check
    // =========================================================================
    group('Recruitment Cases & Transitions', () {
      test(
        'getProcessingCases() supports queue filtering and maps models',
        () async {
          mockAdapter.handler = (options) {
            expect(options.path, ApiEndpoints.staffProcessing);
            expect(options.queryParameters['queue'], 'document_officer');

            final body = jsonEncode({
              'success': true,
              'data': {
                'cases': [
                  {
                    'id': 'case_001',
                    'processingCode': 'SGR-PRC-2026-0045',
                    'currentStage': 'DOCUMENT_PROCESSING',
                    'overallStatus': 'ACTIVE',
                    'priority': 'HIGH',
                    'createdAt': '2026-03-01T10:00:00.000Z',
                    'applicant': {
                      'id': 'cand_88',
                      'applicantNumber': 'CAN-2026-0088',
                      'fullName': 'Kamal Hossain',
                      'phone': '+8801812345678',
                      'passportNumber': 'EA0123456',
                    },
                    'job': {
                      'id': 'job_10',
                      'jobCode': 'JOB-KSA-10',
                      'title': 'Construction Carpenter',
                      'country': {'name': 'Saudi Arabia', 'flag': '🇸🇦'},
                    },
                  },
                ],
                'pagination': {'total': 1, 'totalPages': 1},
              },
            });
            return ResponseBody.fromString(
              body,
              200,
              headers: {
                Headers.contentTypeHeader: [Headers.jsonContentType],
              },
            );
          };

          final result = await repository.getProcessingCases(
            queue: 'document_officer',
          );
          final cases = result['cases'] as List<StaffProcessingCaseModel>;
          expect(cases.length, 1);
          final c = cases.first;
          expect(c.processingCode, 'SGR-PRC-2026-0045');
          expect(c.currentStage, 'DOCUMENT_PROCESSING');
          expect(c.priority, 'HIGH');
          expect(c.applicant?.fullName, 'Kamal Hossain');
          expect(c.applicant?.maskedPassport, 'EA***56');
        },
      );

      test(
        'transitionCase() successfully advances stage on server approval',
        () async {
          mockAdapter.handler = (options) {
            expect(options.path, '/api/staff/processing/case_001/transition');
            expect(options.method, 'POST');
            final data = options.data as Map<String, dynamic>;
            expect(data['targetStage'], 'DOCUMENT_VERIFICATION');

            final body = jsonEncode({
              'success': true,
              'data': {
                'id': 'case_001',
                'currentStage': 'DOCUMENT_VERIFICATION',
              },
            });
            return ResponseBody.fromString(
              body,
              200,
              headers: {
                Headers.contentTypeHeader: [Headers.jsonContentType],
              },
            );
          };

          final res = await repository.transitionCase(
            caseId: 'case_001',
            targetStage: 'DOCUMENT_VERIFICATION',
            notes: 'Dossier paperwork complete',
          );
          expect(res['success'], isTrue);
        },
      );

      test(
          'transitionCase() throws ApiException with blocker explanation when gate requirements fail',
          () async {
        mockAdapter.handler = (options) {
          final body = jsonEncode({
            'success': false,
            'error': 'Stage transition gate requirements not met',
            'blockers': [
              'Mandatory document PASSPORT is not verified',
              'Medical fitness certificate missing',
            ],
          });
          return ResponseBody.fromString(
            body,
            422,
            headers: {
              Headers.contentTypeHeader: [Headers.jsonContentType],
            },
          );
        };

        expect(
          () async => await repository.transitionCase(
            caseId: 'case_001',
            targetStage: 'VISA_SUBMITTED',
          ),
          throwsA(
            predicate(
              (e) =>
                  e is ApiException &&
                  e.message.contains(
                    'Stage transition gate requirements not met',
                  ) &&
                  e.message.contains(
                    'Mandatory document PASSPORT is not verified',
                  ),
            ),
          ),
        );
      });
    });

    // =========================================================================
    // 4. Applicant Management & Privacy Masking
    // =========================================================================
    group('Applicant Privacy & Management', () {
      test(
        'StaffApplicantModel masks sensitive passport and phone numbers',
        () {
          const applicant = StaffApplicantModel(
            id: 'cand_99',
            applicantNumber: 'CAN-2026-0099',
            fullName: 'Md. Delwar Hossain',
            phone: '+8801712345678',
            passportNumber: 'EA0987654',
            status: 'ACTIVE',
          );

          // Verify privacy masking algorithms
          expect(applicant.maskedPassport, 'EA***54');
          expect(applicant.maskedPhone, '+880****678');
        },
      );

      test('getApplicants() parses items with count and metadata', () async {
        mockAdapter.handler = (options) {
          expect(options.path, ApiEndpoints.staffApplicants);
          final body = jsonEncode({
            'success': true,
            'data': {
              'items': [
                {
                  'id': 'cand_10',
                  'applicantNumber': 'CAN-0010',
                  'fullName': 'Rafiqul Islam',
                  'phone': '+8801711223344',
                  'passportNumber': 'B01234567',
                  'status': 'ACTIVE',
                  'profession': 'Pipe Fitter',
                  'preferredCountry': {'name': 'Qatar', 'flag': '🇶🇦'},
                  '_count': {'documents': 4, 'notes': 2, 'applications': 1},
                },
              ],
              'pagination': {'total': 1, 'totalPages': 1},
            },
          });
          return ResponseBody.fromString(
            body,
            200,
            headers: {
              Headers.contentTypeHeader: [Headers.jsonContentType],
            },
          );
        };

        final res = await repository.getApplicants();
        final list = res['applicants'] as List<StaffApplicantModel>;
        expect(list.length, 1);
        final a = list.first;
        expect(a.applicantNumber, 'CAN-0010');
        expect(a.fullName, 'Rafiqul Islam');
        expect(a.countryName, 'Qatar');
        expect(a.documentsCount, 4);
        expect(a.notesCount, 2);
      });
    });

    // =========================================================================
    // 5. Document Verification
    // =========================================================================
    group('Document Review & Verification', () {
      test('verifyDocument() posts verification decision to server', () async {
        mockAdapter.handler = (options) {
          expect(options.path, '/api/documents/doc_123/verify');
          expect(options.method, 'POST');
          final data = options.data as Map<String, dynamic>;
          expect(data['status'], 'VERIFIED');

          final body = jsonEncode({'success': true});
          return ResponseBody.fromString(
            body,
            200,
            headers: {
              Headers.contentTypeHeader: [Headers.jsonContentType],
            },
          );
        };

        final result = await repository.verifyDocument(
          documentId: 'doc_123',
          status: 'VERIFIED',
        );
        expect(result, isTrue);
      });

      test(
        'verifyDocument() submits rejection reason when document is rejected',
        () async {
          mockAdapter.handler = (options) {
            expect(options.path, '/api/documents/doc_123/verify');
            final data = options.data as Map<String, dynamic>;
            expect(data['status'], 'REJECTED');
            expect(
              data['rejectionReason'],
              'Passport bio page is blurry and unreadable',
            );

            final body = jsonEncode({'success': true});
            return ResponseBody.fromString(
              body,
              200,
              headers: {
                Headers.contentTypeHeader: [Headers.jsonContentType],
              },
            );
          };

          final result = await repository.verifyDocument(
            documentId: 'doc_123',
            status: 'REJECTED',
            rejectionReason: 'Passport bio page is blurry and unreadable',
          );
          expect(result, isTrue);
        },
      );
    });

    // =========================================================================
    // 6. Interview Appointments & Audit Logs
    // =========================================================================
    group('Interviews & System Audit Logs', () {
      test('getInterviews() parses scheduled interview appointments', () async {
        mockAdapter.handler = (options) {
          expect(options.path, ApiEndpoints.interviews);
          final body = jsonEncode({
            'success': true,
            'data': [
              {
                'id': 'int_1',
                'scheduledAt': '2026-11-05T09:30:00.000Z',
                'interviewType': 'IN_PERSON',
                'status': 'SCHEDULED',
                'location': 'Shakil Travels Office, Dhaka',
                'applicant': {
                  'fullName': 'Sohag Mia',
                  'applicantNumber': 'CAN-2026-0044',
                  'phone': '+8801912345678',
                },
                'application': {
                  'job': {'title': 'Security Guard', 'jobCode': 'JOB-UAE-02'},
                },
              },
            ],
          });
          return ResponseBody.fromString(
            body,
            200,
            headers: {
              Headers.contentTypeHeader: [Headers.jsonContentType],
            },
          );
        };

        final list = await repository.getInterviews();
        expect(list.length, 1);
        final i = list.first;
        expect(i.applicantName, 'Sohag Mia');
        expect(i.jobTitle, 'Security Guard');
        expect(i.status, 'SCHEDULED');
      });

      test('getAuditLogs() parses admin oversight activity feed', () async {
        mockAdapter.handler = (options) {
          expect(options.path, ApiEndpoints.auditLogs);
          final body = jsonEncode({
            'success': true,
            'data': {
              'items': [
                {
                  'id': 'aud_9',
                  'action': 'LOGIN_SUCCESS',
                  'entity': 'AUTH',
                  'actorType': 'STAFF',
                  'description': 'Staff login successful',
                  'createdAt': '2026-10-25T17:00:00Z',
                  'user': {
                    'name': 'Accounts Manager',
                    'email': 'accounts@shakiltravels.com',
                  },
                  'ipAddress': '192.168.1.15',
                },
              ],
              'pagination': {'total': 1, 'totalPages': 1},
            },
          });
          return ResponseBody.fromString(
            body,
            200,
            headers: {
              Headers.contentTypeHeader: [Headers.jsonContentType],
            },
          );
        };

        final res = await repository.getAuditLogs();
        final logs = res['logs'] as List<StaffAuditLogModel>;
        expect(logs.length, 1);
        expect(logs.first.action, 'LOGIN_SUCCESS');
        expect(logs.first.userName, 'Accounts Manager');
        expect(logs.first.ipAddress, '192.168.1.15');
      });
    });
  });
}
