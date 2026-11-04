import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shakil_travels/core/config/app_config.dart';
import 'package:shakil_travels/core/errors/api_exception.dart';
import 'package:shakil_travels/core/network/api_client.dart';
import 'package:shakil_travels/core/network/api_endpoints.dart';
import 'package:shakil_travels/features/candidate/data/candidate_models.dart';
import 'package:shakil_travels/features/candidate/data/candidate_repository.dart';

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
  group('Phase 3: Candidate Portal Data Models & Repository Tests', () {
    late ApiClient apiClient;
    late MockHttpAdapter mockAdapter;
    late CandidateRepository repository;

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
      repository = CandidateRepository(apiClient: apiClient);
    });

    // =========================================================================
    // 1. Profile Model & Endpoints
    // =========================================================================
    group('Candidate Profile', () {
      test(
        'CandidateProfileModel.fromJson parses complete candidate profile',
        () {
          final rawJson = {
            'id': 'cand_123',
            'applicantNumber': 'CAN-2026-0042',
            'fullName': 'Mohammad Rakib Hossain',
            'fatherName': 'Abdul Karim',
            'motherName': 'Rokeya Begum',
            'phone': '+8801712345678',
            'email': 'rakib@example.com',
            'district': 'Cumilla',
            'upazila': 'Muradnagar',
            'profession': 'Electrician',
            'yearsOfExperience': 5,
            'passportAvailable': true,
            'passportNumber': 'EA0987654',
            'status': 'ACTIVE',
            'completion': {
              'percentage': 85,
              'missingFields': ['emergencyContact', 'medicalCertificate'],
            },
            'preferredCountry': {
              'id': 'c_sa',
              'name': 'Saudi Arabia',
              'flag': '🇸🇦',
            },
          };

          final profile = CandidateProfileModel.fromJson(rawJson);
          expect(profile.id, 'cand_123');
          expect(profile.applicantNumber, 'CAN-2026-0042');
          expect(profile.fullName, 'Mohammad Rakib Hossain');
          expect(profile.fatherName, 'Abdul Karim');
          expect(profile.passportAvailable, isTrue);
          expect(profile.passportNumber, 'EA0987654');
          expect(profile.profileCompletion, 85);
          expect(profile.missingFields.length, 2);
          expect(profile.preferredCountryName, 'Saudi Arabia');
        },
      );

      test(
        'getProfile() calls candidate profile endpoint and returns model',
        () async {
          mockAdapter.handler = (options) {
            expect(options.path, ApiEndpoints.candidateProfile);
            expect(options.method, 'GET');

            final body = jsonEncode({
              'success': true,
              'data': {
                'id': 'cand_1',
                'applicantNumber': 'CAN-001',
                'fullName': 'Sabbir Ahmed',
                'phone': '+8801811223344',
                'status': 'ACTIVE',
                'profileCompletion': 90,
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

          final profile = await repository.getProfile();
          expect(profile.id, 'cand_1');
          expect(profile.fullName, 'Sabbir Ahmed');
          expect(profile.phone, '+8801811223344');
        },
      );

      test(
        'updateProfile() sends PUT payload and returns updated model',
        () async {
          mockAdapter.handler = (options) {
            expect(options.path, ApiEndpoints.candidateProfile);
            expect(options.method, 'PUT');
            final payload = options.data as Map<String, dynamic>;
            expect(payload['fullName'], 'Sabbir Ahmed Updated');
            expect(payload['district'], 'Dhaka');

            final body = jsonEncode({
              'success': true,
              'data': {
                'id': 'cand_1',
                'applicantNumber': 'CAN-001',
                'fullName': 'Sabbir Ahmed Updated',
                'district': 'Dhaka',
                'phone': '+8801811223344',
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

          const existing = CandidateProfileModel(
            id: 'cand_1',
            applicantNumber: 'CAN-001',
            fullName: 'Sabbir Ahmed Updated',
            phone: '+8801811223344',
            district: 'Dhaka',
          );

          final updated = await repository.updateProfile(existing);
          expect(updated.fullName, 'Sabbir Ahmed Updated');
          expect(updated.district, 'Dhaka');
        },
      );
    });

    // =========================================================================
    // 2. Official 13-Stage Deployment & Applications
    // =========================================================================
    group('13-Stage Deployment & Applications', () {
      test(
        'CandidateRepository defines all 13 official ERP deployment stages',
        () {
          const stages = CandidateRepository.official13Stages;
          expect(stages.length, 13);
          expect(stages[0]['key'], 'SELECTED');
          expect(stages[1]['key'], 'DOCUMENT_PROCESSING');
          expect(stages[2]['key'], 'DOCUMENT_VERIFICATION');
          expect(stages[3]['key'], 'MEDICAL_SCHEDULED');
          expect(stages[4]['key'], 'MEDICAL_PASSED');
          expect(stages[5]['key'], 'VISA_PREPARATION');
          expect(stages[6]['key'], 'VISA_PROCESSING');
          expect(stages[7]['key'], 'VISA_APPROVED');
          expect(stages[8]['key'], 'CLEARANCE_PROCESSING');
          expect(stages[9]['key'], 'CLEARANCE_COMPLETED');
          expect(stages[10]['key'], 'TICKET_ISSUED');
          expect(stages[11]['key'], 'DEPARTURE_READY');
          expect(stages[12]['key'], 'DEPARTED');

          // Verify bilingual labels are present for all 13 stages
          for (final s in stages) {
            expect(s['label'], isNotEmpty);
            expect(s['labelBn'], isNotEmpty);
            expect(s['desc'], isNotEmpty);
            expect(s['descBn'], isNotEmpty);
          }
        },
      );

      test(
        'getMyApplications() parses candidate application list correctly',
        () async {
          mockAdapter.handler = (options) {
            expect(options.path, ApiEndpoints.candidateApplications);
            final body = jsonEncode({
              'success': true,
              'data': [
                {
                  'id': 'app_1',
                  'applicationCode': 'APP-2026-001',
                  'status': 'PROCESSING',
                  'effectiveStage': 'MEDICAL_SCHEDULED',
                  'createdAt': '2026-03-01T10:00:00.000Z',
                  'job': {
                    'title': 'Heavy Equipment Driver',
                    'jobCode': 'JOB-KSA-01',
                    'salaryMin': 2200,
                    'salaryCurrency': 'SAR',
                    'country': {'name': 'Saudi Arabia', 'flag': '🇸🇦'},
                    'employer': {'companyName': 'Al-Rashid Contracting'},
                  },
                  'processingCase': {
                    'id': 'pc_999',
                    'currentStage': 'MEDICAL_SCHEDULED',
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

          final apps = await repository.getMyApplications();
          expect(apps.length, 1);
          final app = apps.first;
          expect(app.applicationCode, 'APP-2026-001');
          expect(app.effectiveStage, 'MEDICAL_SCHEDULED');
          expect(app.jobTitle, 'Heavy Equipment Driver');
          expect(app.countryName, 'Saudi Arabia');
          expect(app.salaryMin, 2200.0);
          expect(app.currency, 'SAR');
          expect(app.processingCaseId, 'pc_999');
        },
      );

      test(
        'getProcessingTimeline() fetches timeline stages from ERP',
        () async {
          mockAdapter.handler = (options) {
            expect(options.path, '/api/portal/processing/pc_999/timeline');
            final body = jsonEncode({
              'success': true,
              'data': {
                'currentStage': 'VISA_PROCESSING',
                'timeline': [
                  {'stage': 'SELECTED', 'completedAt': '2026-01-10T09:00:00Z'},
                  {
                    'stage': 'DOCUMENT_PROCESSING',
                    'completedAt': '2026-01-15T11:00:00Z',
                  },
                  {
                    'stage': 'MEDICAL_PASSED',
                    'completedAt': '2026-01-25T14:00:00Z',
                  },
                  {'stage': 'VISA_PROCESSING', 'completedAt': null},
                ],
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

          final result = await repository.getProcessingTimeline('pc_999');
          expect(result['currentStage'], 'VISA_PROCESSING');
          final timeline = result['timeline'] as List;
          expect(timeline.length, 4);
        },
      );
    });

    // =========================================================================
    // 3. Overseas Jobs & Circulars
    // =========================================================================
    group('Overseas Job Circulars', () {
      test(
        'getJobs() supports search query and filtering parameters',
        () async {
          mockAdapter.handler = (options) {
            expect(options.path, ApiEndpoints.jobs);
            expect(options.queryParameters['search'], 'Plumber');
            expect(options.queryParameters['countryId'], 'c_uae');

            final body = jsonEncode({
              'success': true,
              'data': [
                {
                  'id': 'job_45',
                  'jobCode': 'JOB-UAE-45',
                  'title': 'Master Plumber',
                  'description': 'Commercial plumbing experience required',
                  'vacancies': 10,
                  'salaryMin': 1800,
                  'salaryMax': 2200,
                  'currency': 'AED',
                  'status': 'PUBLISHED',
                  'country': {
                    'id': 'c_uae',
                    'name': 'United Arab Emirates',
                    'flag': '🇦🇪',
                  },
                  'category': {'name': 'Construction'},
                  'foodProvided': true,
                  'accommodationProvided': true,
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

          final jobs = await repository.getJobs(
            search: 'Plumber',
            countryId: 'c_uae',
          );

          expect(jobs.length, 1);
          final job = jobs.first;
          expect(job.title, 'Master Plumber');
          expect(job.currency, 'AED');
          expect(job.foodProvided, isTrue);
          expect(job.accommodationProvided, isTrue);
          expect(job.isOpen, isTrue);
        },
      );

      test(
        'applyForJob() posts to correct job apply route and returns success',
        () async {
          mockAdapter.handler = (options) {
            expect(options.path, '/api/portal/jobs/job_45/apply');
            expect(options.method, 'POST');

            final body = jsonEncode({
              'success': true,
              'data': {
                'applicationId': 'app_new_101',
                'applicationCode': 'APP-2026-101',
                'status': 'NEW',
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

          final res = await repository.applyForJob('job_45');
          expect(res['success'], isTrue);
          expect(res['data']['applicationCode'], 'APP-2026-101');
        },
      );

      test(
        'applyForJob() handles 3 active applications limit error gracefully',
        () async {
          mockAdapter.handler = (options) {
            final body = jsonEncode({
              'success': false,
              'error':
                  'Maximum active application limit reached (3). Wait for current applications to resolve.',
            });
            return ResponseBody.fromString(
              body,
              400,
              headers: {
                Headers.contentTypeHeader: [Headers.jsonContentType],
              },
            );
          };

          expect(
            () async => await repository.applyForJob('job_45'),
            throwsA(
              predicate(
                (e) =>
                    e is ApiException &&
                    e.message.contains(
                      'Maximum active application limit reached',
                    ),
              ),
            ),
          );
        },
      );
    });

    // =========================================================================
    // 4. Documents Hub & Upload
    // =========================================================================
    group('Candidate Documents', () {
      test(
        'getDocuments() parses existing documents and document types',
        () async {
          mockAdapter.handler = (options) {
            expect(options.path, ApiEndpoints.candidateDocuments);
            final body = jsonEncode({
              'success': true,
              'data': {
                'documents': [
                  {
                    'id': 'doc_1',
                    'fileName': 'passport_scanned.pdf',
                    'fileSize': 1500000,
                    'mimeType': 'application/pdf',
                    'status': 'VERIFIED',
                    'createdAt': '2026-02-01T12:00:00Z',
                    'documentType': {
                      'id': 'dt_pass',
                      'name': 'Passport Bio Page',
                      'code': 'PASSPORT',
                      'isRequired': true,
                    },
                  },
                ],
                'documentTypes': [
                  {
                    'id': 'dt_pass',
                    'name': 'Passport Bio Page',
                    'code': 'PASSPORT',
                    'isRequired': true,
                  },
                  {
                    'id': 'dt_nid',
                    'name': 'National ID Card',
                    'code': 'NID',
                    'isRequired': true,
                  },
                ],
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

          final res = await repository.getDocuments();
          final docs = res['documents'] as List<CandidateDocumentModel>;
          final types = res['documentTypes'] as List<DocumentTypeModel>;

          expect(docs.length, 1);
          expect(docs.first.fileName, 'passport_scanned.pdf');
          expect(docs.first.isVerified, isTrue);
          expect(docs.first.documentType?.code, 'PASSPORT');
          expect(types.length, 2);
        },
      );

      test(
          'uploadDocument() rejects non-existent file path before making API request',
          () async {
        expect(
          () async => await repository.uploadDocument(
            documentTypeId: 'dt_pass',
            filePath: '/non_existent_directory/fake_file.pdf',
            fileName: 'fake_file.pdf',
          ),
          throwsA(
            predicate(
              (e) =>
                  e is ApiException &&
                  e.message.contains('does not exist on device'),
            ),
          ),
        );
      });
    });

    // =========================================================================
    // 5. Financial Statements & Payment History
    // =========================================================================
    group('Candidate Finance & Payments', () {
      test(
        'getFinanceSummary() parses invoices, payments, and balances',
        () async {
          mockAdapter.handler = (options) {
            expect(options.path, ApiEndpoints.candidateFinance);
            final body = jsonEncode({
              'success': true,
              'data': {
                'summary': {
                  'totalInvoiced': 250000.0,
                  'totalPaid': 150000.0,
                  'totalDue': 100000.0,
                  'runningBalance': 100000.0,
                },
                'invoices': [
                  {
                    'id': 'inv_1',
                    'invoiceNumber': 'INV-2026-0089',
                    'invoiceDate': '2026-02-15T00:00:00Z',
                    'totalAmount': 250000.0,
                    'paidAmount': 150000.0,
                    'dueAmount': 100000.0,
                    'status': 'PARTIALLY_PAID',
                    'job': {'title': 'Structural Welder'},
                  },
                ],
                'payments': [
                  {
                    'id': 'pay_1',
                    'paymentNumber': 'PAY-2026-015',
                    'paymentDate': '2026-02-20T00:00:00Z',
                    'amount': 150000.0,
                    'paymentMethod': 'BANK_TRANSFER',
                    'status': 'COMPLETED',
                    'invoice': {'invoiceNumber': 'INV-2026-0089'},
                    'receipts': [
                      {'receiptNumber': 'REC-2026-015'},
                    ],
                  },
                ],
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

          final finance = await repository.getFinanceSummary();
          expect(finance.totalInvoiced, 250000.0);
          expect(finance.totalPaid, 150000.0);
          expect(finance.totalDue, 100000.0);
          expect(finance.invoices.length, 1);
          expect(finance.invoices.first.invoiceNumber, 'INV-2026-0089');
          expect(finance.invoices.first.dueAmount, 100000.0);
          expect(finance.invoices.first.isPaid, isFalse);

          expect(finance.payments.length, 1);
          expect(finance.payments.first.receiptNumber, 'REC-2026-015');
          expect(finance.payments.first.paymentMethod, 'BANK_TRANSFER');
          expect(finance.payments.first.amount, 150000.0);
        },
      );
    });
  });
}
