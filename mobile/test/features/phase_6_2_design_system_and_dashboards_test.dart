import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shakil_travels/app/theme/app_spacing.dart';
import 'package:shakil_travels/core/network/api_client.dart';
import 'package:shakil_travels/features/admin/presentation/screens/admin_dashboard_screen.dart';
import 'package:shakil_travels/features/admin/presentation/screens/admin_main_navigation_screen.dart';
import 'package:shakil_travels/features/auth/data/auth_repository.dart';
import 'package:shakil_travels/features/auth/data/session_model.dart';
import 'package:shakil_travels/features/candidate/data/candidate_repository.dart';
import 'package:shakil_travels/features/candidate/presentation/screens/candidate_dashboard_screen.dart';
import 'package:shakil_travels/features/candidate/presentation/screens/candidate_main_navigation_screen.dart';
import 'package:shakil_travels/features/staff/data/staff_repository.dart';
import 'package:shakil_travels/features/staff/presentation/screens/staff_dashboard_screen.dart';
import 'package:shakil_travels/features/staff/presentation/screens/staff_main_navigation_screen.dart';
import 'package:shakil_travels/shared/widgets/app_app_bar.dart';
import 'package:shakil_travels/shared/widgets/app_bottom_navigation.dart';
import 'package:shakil_travels/shared/widgets/app_empty_state.dart';
import 'package:shakil_travels/shared/widgets/error_view.dart';
import 'package:shakil_travels/shared/widgets/loading_indicator.dart';

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
  group('Phase 6.2: Global Design System & Dashboard Refinement Tests', () {
    late ApiClient apiClient;
    late MockHttpAdapter mockAdapter;
    late CandidateRepository candidateRepo;
    late StaffRepository staffRepo;
    late AuthRepository authRepo;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      mockAdapter = MockHttpAdapter();
      final dio = Dio(BaseOptions(baseUrl: 'http://test.local'));
      dio.httpClientAdapter = mockAdapter;
      apiClient = ApiClient(dio: dio);
      candidateRepo = CandidateRepository(apiClient: apiClient);
      staffRepo = StaffRepository(apiClient: apiClient);
      authRepo = AuthRepository(apiClient: apiClient);
    });

    // =========================================================================
    // 1. DESIGN SYSTEM TOKEN & WIDGET TESTS
    // =========================================================================
    group('Task 2: Global Design System Tokens & Widgets', () {
      test('AppSpacing constants meet 4dp/8dp scale and accessibility target >= 48dp', () {
        expect(AppSpacing.xs, 4.0);
        expect(AppSpacing.sm, 8.0);
        expect(AppSpacing.md, 12.0);
        expect(AppSpacing.lg, 16.0);
        expect(AppSpacing.xl, 20.0);
        expect(AppSpacing.xxl, 24.0);
        expect(AppSpacing.minTouchTarget, greaterThanOrEqualTo(48.0));
      });

      testWidgets('AppAppBar renders title, subtitle, and custom actions', (tester) async {
        bool actionTapped = false;
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              appBar: AppAppBar(
                title: 'টেস্ট টাইটেল',
                subtitle: 'টেস্ট সাবটাইটেল',
                actions: [
                  IconButton(
                    icon: const Icon(Icons.star),
                    onPressed: () => actionTapped = true,
                  ),
                ],
              ),
            ),
          ),
        );

        expect(find.text('টেস্ট টাইটেল'), findsOneWidget);
        expect(find.text('টেস্ট সাবটাইটেল'), findsOneWidget);
        expect(find.byIcon(Icons.star), findsOneWidget);

        await tester.tap(find.byIcon(Icons.star));
        expect(actionTapped, isTrue);
      });

      testWidgets('AppEmptyState renders illustration, title, message and fires CTA', (tester) async {
        bool ctaTapped = false;
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: AppEmptyState(
                icon: Icons.inbox_rounded,
                title: 'কোনো তথ্য নেই',
                message: 'বর্তমানে কোনো রেকর্ড ডাটাবেজে সংরক্ষিত নেই।',
                actionText: 'নতুন যোগ করুন',
                onAction: () => ctaTapped = true,
              ),
            ),
          ),
        );

        expect(find.byIcon(Icons.inbox_rounded), findsOneWidget);
        expect(find.text('কোনো তথ্য নেই'), findsOneWidget);
        expect(find.text('বর্তমানে কোনো রেকর্ড ডাটাবেজে সংরক্ষিত নেই।'), findsOneWidget);
        expect(find.text('নতুন যোগ করুন'), findsOneWidget);

        await tester.tap(find.text('নতুন যোগ করুন'));
        expect(ctaTapped, isTrue);
      });

      testWidgets('AppBottomNavigation renders items, active selection, and badges', (tester) async {
        int selectedIndex = 0;
        await tester.pumpWidget(
          MaterialApp(
            home: StatefulBuilder(
              builder: (context, setState) {
                return Scaffold(
                  bottomNavigationBar: AppBottomNavigation(
                    currentIndex: selectedIndex,
                    onTap: (idx) => setState(() => selectedIndex = idx),
                    items: const [
                      AppBottomNavItem(icon: Icons.home, label: 'হোম'),
                      AppBottomNavItem(icon: Icons.work, label: 'সার্কুলার', badgeCount: 5),
                      AppBottomNavItem(icon: Icons.person, label: 'প্রোফাইল'),
                    ],
                  ),
                );
              },
            ),
          ),
        );

        expect(find.text('হোম'), findsOneWidget);
        expect(find.text('সার্কুলার'), findsOneWidget);
        expect(find.text('প্রোফাইল'), findsOneWidget);
        expect(find.text('5'), findsOneWidget);

        await tester.tap(find.text('সার্কুলার'));
        await tester.pumpAndSettle();
        expect(selectedIndex, 1);
      });

      testWidgets('LoadingIndicator and ErrorView render correctly', (tester) async {
        bool retried = false;
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: Column(
                children: [
                  const LoadingIndicator(message: 'তথ্য লোড হচ্ছে...'),
                  ErrorView(
                    title: 'সার্ভার সমস্যা',
                    message: 'ইন্টারনেট কানেকশন চেক করুন।',
                    onRetry: () => retried = true,
                  ),
                ],
              ),
            ),
          ),
        );

        expect(find.text('তথ্য লোড হচ্ছে...'), findsOneWidget);
        expect(find.text('সার্ভার সমস্যা'), findsOneWidget);
        expect(find.text('ইন্টারনেট কানেকশন চেক করুন।'), findsOneWidget);
        expect(find.text('Try Again'), findsOneWidget);

        await tester.tap(find.text('Try Again'));
        expect(retried, isTrue);
      });
    });

    // =========================================================================
    // 2. CANDIDATE DASHBOARD REFINEMENT TESTS
    // =========================================================================
    group('Task 3: Candidate Dashboard Component & Data Integration', () {
      const mockCandidateSession = SessionModel(
        token: 'candidate_jwt_token',
        role: 'CANDIDATE',
        userId: 'cand_test_01',
        fullName: 'তানভীর আহমেদ',
        phone: '01932861133',
        applicantNumber: 'CAN-2026-0099',
      );

      void setupCandidateMocks() {
        mockAdapter.handler = (options) {
          if (options.path.contains('/api/portal/profile')) {
            return ResponseBody.fromString(
              jsonEncode({
                'success': true,
                'data': {
                  'id': 'cand_test_01',
                  'applicantNumber': 'CAN-2026-0099',
                  'fullName': 'তানভীর আহমেদ',
                  'phone': '01932861133',
                  'profession': 'Pipe Fitter',
                  'status': 'ACTIVE',
                  'completion': {'percentage': 90, 'missingFields': ['emergencyContact']},
                },
              }),
              200,
              headers: {'content-type': ['application/json']},
            );
          } else if (options.path.contains('/api/portal/applications')) {
            return ResponseBody.fromString(
              jsonEncode({
                'success': true,
                'data': [
                  {
                    'id': 'app_01',
                    'applicationCode': 'APP-2026-0012',
                    'status': 'PROCESSING',
                    'jobTitle': 'Senior Pipe Fitter',
                    'countryName': 'Saudi Arabia',
                    'countryFlag': '🇸🇦',
                    'employerName': 'Al-Rashid Trading & Contracting',
                  }
                ],
              }),
              200,
              headers: {'content-type': ['application/json']},
            );
          } else if (options.path.contains('/api/portal/documents')) {
            return ResponseBody.fromString(
              jsonEncode({
                'success': true,
                'data': {
                  'documents': [
                    {'id': 'doc_1', 'fileName': 'passport.pdf', 'status': 'VERIFIED', 'fileSize': 1024, 'mimeType': 'application/pdf', 'createdAt': '2026-11-01'},
                    {'id': 'doc_2', 'fileName': 'police_clearance.pdf', 'status': 'UNDER_REVIEW', 'fileSize': 2048, 'mimeType': 'application/pdf', 'createdAt': '2026-11-02'},
                  ],
                  'documentTypes': [
                    {'id': 'dt_1', 'name': 'Passport', 'code': 'PASSPORT', 'isRequired': true},
                  ],
                },
              }),
              200,
              headers: {'content-type': ['application/json']},
            );
          } else if (options.path.contains('/api/portal/finance')) {
            return ResponseBody.fromString(
              jsonEncode({
                'success': true,
                'data': {
                  'summary': {
                    'totalInvoiced': 150000.0,
                    'totalPaid': 100000.0,
                    'totalDue': 50000.0,
                    'runningBalance': 50000.0,
                  },
                  'invoices': [],
                  'payments': [],
                },
              }),
              200,
              headers: {'content-type': ['application/json']},
            );
          } else if (options.path.contains('/api/jobs')) {
            return ResponseBody.fromString(
              jsonEncode({
                'success': true,
                'data': [
                  {
                    'id': 'job_01',
                    'jobCode': 'JOB-SA-01',
                    'title': 'Heavy Equipment Operator',
                    'countryName': 'Saudi Arabia',
                    'countryFlag': '🇸🇦',
                    'vacancies': 15,
                    'salaryMin': 2500.0,
                    'currency': 'SAR',
                    'status': 'OPEN',
                  }
                ],
              }),
              200,
              headers: {'content-type': ['application/json']},
            );
          } else if (options.path.contains('/api/portal/interviews')) {
            return ResponseBody.fromString(
              jsonEncode({
                'success': true,
                'data': [
                  {
                    'id': 'int_01',
                    'scheduledAt': '2026-11-15T10:00:00Z',
                    'venue': 'শাকিল ট্রাভেলস ঢাকা হেড অফিস',
                    'job': {'title': 'Heavy Equipment Operator'},
                  }
                ],
              }),
              200,
              headers: {'content-type': ['application/json']},
            );
          }
          return ResponseBody.fromString(jsonEncode({'success': true, 'data': {}}), 200);
        };
      }

      testWidgets('Renders all required candidate dashboard sections with server data', (tester) async {
        setupCandidateMocks();

        await tester.pumpWidget(
          MaterialApp(
            home: CandidateDashboardScreen(
              session: mockCandidateSession,
              repository: candidateRepo,
            ),
          ),
        );

        for (int i = 0; i < 10; i++) {
          await tester.pump(const Duration(milliseconds: 100));
        }

        // 1. Profile Bio Card
        expect(find.text('তানভীর আহমেদ'), findsOneWidget);
        expect(find.text('আইডি: CAN-2026-0099'), findsOneWidget);
        expect(find.text('ট্রেড: Pipe Fitter'), findsOneWidget);

        // 2. Profile Completion Bar
        expect(find.text('90%'), findsOneWidget);
        expect(find.textContaining('বাকি তথ্য: emergencyContact'), findsOneWidget);

        // 3. Upcoming Interview Schedule
        expect(find.textContaining('আসন্ন ইন্টারভিউ শিডিউল'), findsOneWidget);
        expect(find.textContaining('Heavy Equipment Operator'), findsWidgets);

        // 4. Active Application
        expect(find.text('Senior Pipe Fitter'), findsOneWidget);
        expect(find.text('গন্তব্য: Saudi Arabia'), findsOneWidget);

        // 5. Document Verification Status
        expect(find.text('ডকুমেন্ট ভেরিফিকেশন (Document Compliance)'), findsOneWidget);
        expect(find.text('মোট: 2 টি'), findsOneWidget);

        // 6. Payment & Billing Summary
        expect(find.text('পেমেন্ট ও লেজার সারসংক্ষেপ (Finance)'), findsOneWidget);
        expect(find.text('বকেয়া রয়েছে'), findsOneWidget);

        // 7. Quick Actions & Helpline
        expect(find.text('চাকরির সার্কুলার'), findsOneWidget);
        expect(find.textContaining('শাকিল ট্রাভেলস অফিসিয়াল ডেস্ক (RL-2579)'), findsOneWidget);
      });
    });

    // =========================================================================
    // 3. STAFF DASHBOARD REFINEMENT TESTS
    // =========================================================================
    group('Task 4: Staff Dashboard & RBAC Enforcement', () {
      const mockStaffSession = SessionModel(
        token: 'staff_jwt_token',
        role: 'DOCUMENT_OFFICER',
        userId: 'staff_doc_01',
        fullName: 'তাহমিনা আক্তার',
        email: 'tahmina@shakiltravels.com',
        permissions: ['DOCUMENT_VIEW', 'DOCUMENT_VERIFY'],
      );

      void setupStaffMocks() {
        mockAdapter.handler = (options) {
          if (options.path.contains('/api/dashboard/stats')) {
            return ResponseBody.fromString(
              jsonEncode({
                'success': true,
                'data': {
                  'staff': {'total': 18, 'active': 16, 'inactive': 2},
                  'notifications': 3,
                  'totalAuditLogs': 142,
                  'recentActivity': [
                    {
                      'id': 'log_1',
                      'action': 'DOCUMENT_VERIFIED',
                      'entity': 'Passport',
                      'description': 'Verified passport for candidate CAN-2026-0042',
                      'createdAt': '2026-11-04T10:00:00Z',
                      'userName': 'Tahmina Akter',
                    }
                  ],
                  'business': {
                    'applicants': 450,
                    'activeApplicants': 120,
                    'jobs': 35,
                    'publishedJobs': 28,
                    'employers': 12,
                    'countries': 6,
                    'applications': 85,
                    'invoices': 90,
                    'payments': 12500000.0,
                    'dues': 4500000.0,
                    'activeVisas': 22,
                    'newInquiries': 14,
                    'placements': 48,
                  },
                },
              }),
              200,
              headers: {'content-type': ['application/json']},
            );
          }
          return ResponseBody.fromString(jsonEncode({'success': true, 'data': {}}), 200);
        };
      }

      testWidgets('Renders staff workspace and enforces RBAC permission gating on restricted queues', (tester) async {
        setupStaffMocks();

        await tester.pumpWidget(
          MaterialApp(
            home: StaffDashboardScreen(
              session: mockStaffSession,
              repository: staffRepo,
            ),
          ),
        );

        for (int i = 0; i < 10; i++) {
          await tester.pump(const Duration(milliseconds: 100));
        }

        // Staff Profile Header
        expect(find.text('তাহমিনা আক্তার'), findsOneWidget);
        expect(find.text('DOCUMENT_OFFICER'), findsOneWidget);

        // Operational Metrics
        expect(find.text('সক্রিয় প্রার্থী'), findsOneWidget);
        expect(find.text('120'), findsOneWidget);
        expect(find.text('চলমান ফাইল'), findsOneWidget);
        expect(find.text('85'), findsOneWidget);

        // Document Verification Queue is allowed for DOCUMENT_OFFICER
        expect(find.text('কাগজপত্র নিরীক্ষা ও অনুমোদন'), findsOneWidget);

        // Medical and Visa queues are restricted for this role
        expect(find.text('অনুমতি সংরক্ষিত (Restricted)'), findsWidgets);

        // Tapping restricted queue displays administrative notice
        await tester.tap(find.text('মেডিকেল ফিটনেস কিউ'));
        await tester.pump();
        expect(find.textContaining('প্রশাসনিক অনুমতি আপনার অ্যাকাউন্টে নেই'), findsOneWidget);
      });
    });

    // =========================================================================
    // 4. ADMIN DASHBOARD REFINEMENT TESTS
    // =========================================================================
    group('Task 5: Admin Executive Dashboard & Financial Gating', () {
      const mockSuperAdminSession = SessionModel(
        token: 'superadmin_jwt_token',
        role: 'SUPER_ADMIN',
        userId: 'admin_exec_01',
        fullName: 'শাকিল চৌধুরী (ব্যবস্থাপনা পরিচালক)',
        email: 'admin@shakiltravels.com',
        permissions: ['*'],
      );

      const mockViewerSession = SessionModel(
        token: 'viewer_jwt_token',
        role: 'VIEWER',
        userId: 'viewer_01',
        fullName: 'সাধারণ নিরীক্ষক',
        email: 'auditor@shakiltravels.com',
        permissions: ['REPORT_VIEW'],
      );

      void setupAdminMocks() {
        mockAdapter.handler = (options) {
          if (options.path.contains('/api/dashboard/stats')) {
            return ResponseBody.fromString(
              jsonEncode({
                'success': true,
                'data': {
                  'staff': {'total': 25, 'active': 22, 'inactive': 3},
                  'notifications': 5,
                  'totalAuditLogs': 520,
                  'recentActivity': [
                    {
                      'id': 'log_99',
                      'action': 'PAYMENT_RECEIVED',
                      'entity': 'Receipt',
                      'description': 'Received 50,000 BDT via Bank Transfer',
                      'createdAt': '2026-11-04T12:00:00Z',
                      'userName': 'Accounts Officer',
                    }
                  ],
                  'business': {
                    'applicants': 850,
                    'activeApplicants': 210,
                    'jobs': 60,
                    'publishedJobs': 52,
                    'employers': 24,
                    'countries': 8,
                    'applications': 140,
                    'invoices': 180,
                    'payments': 24500000.0,
                    'dues': 8500000.0,
                    'activeVisas': 45,
                    'newInquiries': 32,
                    'placements': 112,
                  },
                },
              }),
              200,
              headers: {'content-type': ['application/json']},
            );
          }
          return ResponseBody.fromString(jsonEncode({'success': true, 'data': {}}), 200);
        };
      }

      testWidgets('SUPER_ADMIN sees full executive oversight, financial totals, and quick actions', (tester) async {
        tester.view.physicalSize = const Size(800, 1800);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        setupAdminMocks();

        await tester.pumpWidget(
          MaterialApp(
            home: AdminDashboardScreen(
              session: mockSuperAdminSession,
              repository: staffRepo,
            ),
          ),
        );

        for (int i = 0; i < 10; i++) {
          await tester.pump(const Duration(milliseconds: 100));
        }

        // Header & Role
        expect(find.text('শাকিল চৌধুরী (ব্যবস্থাপনা পরিচালক)'), findsOneWidget);
        expect(find.text('SUPER ADMIN'), findsOneWidget);

        // Quick Command Shortcuts
        expect(find.text('প্রশাসনিক একশন হাব (Admin Command Center)'), findsOneWidget);
        expect(find.text('কিউআর ভেরিফাই'), findsOneWidget);

        // Staff workforce
        expect(find.text('মোট: 25 জন'), findsOneWidget);
        expect(find.text('22 জন'), findsOneWidget);

        // Authorized Financial Oversight (visible to SUPER_ADMIN)
        expect(find.text('আর্থিক হিসাব নিরীক্ষা (Authorized Financial Oversight)'), findsOneWidget);
        expect(find.textContaining('৳ 24,500,000'), findsOneWidget);

        // Security Policy
        expect(find.textContaining('নিরাপত্তা নির্দেশিকা'), findsOneWidget);
      });

      testWidgets('Non-financial roles (VIEWER) do NOT see financial oversight card', (tester) async {
        setupAdminMocks();

        await tester.pumpWidget(
          MaterialApp(
            home: AdminDashboardScreen(
              session: mockViewerSession,
              repository: staffRepo,
            ),
          ),
        );

        for (int i = 0; i < 10; i++) {
          await tester.pump(const Duration(milliseconds: 100));
        }

        // Financial oversight is strictly hidden
        expect(find.text('আর্থিক হিসাব নিরীক্ষা (Authorized Financial Oversight)'), findsNothing);
      });
    });

    // =========================================================================
    // 5. NAVIGATION & LOGOUT UNIFIED ROUTING TESTS
    // =========================================================================
    group('Task 6: Navigation, Logout Routing & Unified Flow', () {
      testWidgets('CandidateMainNavigationScreen uses AppBottomNavigation and renders candidate tabs', (tester) async {
        mockAdapter.handler = (options) => ResponseBody.fromString(jsonEncode({'success': true, 'data': {}}), 200);

        const candSession = SessionModel(
          token: 'cand_token',
          role: 'CANDIDATE',
          userId: 'c_01',
          fullName: 'Test Candidate',
        );

        await tester.pumpWidget(
          MaterialApp(
            home: CandidateMainNavigationScreen(
              session: candSession,
              repository: candidateRepo,
              authRepository: authRepo,
            ),
          ),
        );
        for (int i = 0; i < 5; i++) {
          await tester.pump(const Duration(milliseconds: 100));
        }

        expect(find.byType(AppBottomNavigation), findsOneWidget);
        expect(find.text('হোম'), findsOneWidget);
        expect(find.text('সার্কুলার'), findsOneWidget);
        expect(find.text('আবেদন'), findsOneWidget);
        expect(find.text('ডকুমেন্টস'), findsOneWidget);
        expect(find.text('প্রোফাইল'), findsOneWidget);
      });

      testWidgets('StaffMainNavigationScreen uses AppBottomNavigation and renders staff tabs', (tester) async {
        mockAdapter.handler = (options) => ResponseBody.fromString(jsonEncode({'success': true, 'data': {}}), 200);

        const staffSession = SessionModel(
          token: 'staff_token',
          role: 'RECRUITER',
          userId: 's_01',
          fullName: 'Test Recruiter',
        );

        await tester.pumpWidget(
          MaterialApp(
            home: StaffMainNavigationScreen(
              session: staffSession,
              repository: staffRepo,
              authRepository: authRepo,
            ),
          ),
        );
        for (int i = 0; i < 5; i++) {
          await tester.pump(const Duration(milliseconds: 100));
        }

        expect(find.byType(AppBottomNavigation), findsOneWidget);
        expect(find.text('ওভারভিউ'), findsOneWidget);
        expect(find.text('প্রসেসিং'), findsOneWidget);
        expect(find.text('প্রার্থীগণ'), findsOneWidget);
        expect(find.text('ডকুমেন্টস'), findsOneWidget);
        expect(find.text('প্রোফাইল'), findsOneWidget);
      });

      testWidgets('AdminMainNavigationScreen uses AppBottomNavigation and renders admin tabs', (tester) async {
        mockAdapter.handler = (options) => ResponseBody.fromString(jsonEncode({'success': true, 'data': {}}), 200);

        const adminSession = SessionModel(
          token: 'admin_token',
          role: 'ADMIN',
          userId: 'a_01',
          fullName: 'Test Admin',
        );

        await tester.pumpWidget(
          MaterialApp(
            home: AdminMainNavigationScreen(
              session: adminSession,
              repository: staffRepo,
              authRepository: authRepo,
            ),
          ),
        );
        for (int i = 0; i < 5; i++) {
          await tester.pump(const Duration(milliseconds: 100));
        }

        expect(find.byType(AppBottomNavigation), findsOneWidget);
        expect(find.text('ওভারভিউ'), findsOneWidget);
        expect(find.text('সার্কুলার'), findsOneWidget);
        expect(find.text('প্রসেসিং'), findsOneWidget);
        expect(find.text('অডিট লগ'), findsOneWidget);
        expect(find.text('প্রোফাইল'), findsOneWidget);
      });
    });
  });
}
