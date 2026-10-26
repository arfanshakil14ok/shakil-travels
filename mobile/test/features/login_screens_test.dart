import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shakil_travels/features/auth/presentation/admin_login_screen.dart';
import 'package:shakil_travels/features/auth/presentation/candidate_login_screen.dart';
import 'package:shakil_travels/features/auth/presentation/role_selection_screen.dart';
import 'package:shakil_travels/features/auth/presentation/staff_login_screen.dart';

void main() {
  group('Authentication Screens UI & Form Validation Tests', () {
    testWidgets(
      'CandidateLoginScreen validates empty inputs and toggles password visibility',
      (tester) async {
        await tester.pumpWidget(
          const MaterialApp(home: CandidateLoginScreen()),
        );

        // Verify Screen Elements
        expect(find.text('Candidate Login / প্রার্থী লগইন'), findsOneWidget);
        expect(find.text('মোবাইল নম্বর / আবেদন আইডি / ইমেইল'), findsOneWidget);
        expect(find.text('পাসওয়ার্ড (Password)'), findsOneWidget);
        expect(find.text('লগইন করুন (Sign In)'), findsOneWidget);

        // Tap Sign In with empty fields -> Triggers Form Validation
        await tester.tap(find.text('লগইন করুন (Sign In)'));
        await tester.pumpAndSettle();

        expect(find.text('মোবাইল নম্বর বা আবেদন আইডি লিখুন'), findsOneWidget);
        expect(find.text('পাসওয়ার্ড আবশ্যক'), findsOneWidget);

        // Verify Password Visibility Toggle
        final visibilityIcon = find.byIcon(Icons.visibility_off_rounded);
        expect(visibilityIcon, findsOneWidget);
        await tester.tap(visibilityIcon);
        await tester.pumpAndSettle();
        expect(find.byIcon(Icons.visibility_rounded), findsOneWidget);
      },
    );

    testWidgets('StaffLoginScreen validates corporate email format', (
      tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: StaffLoginScreen()));

      expect(find.text('Staff Login / স্টাফ লগইন'), findsOneWidget);
      expect(find.text('Staff Email (অফিসিয়াল ইমেইল)'), findsOneWidget);

      // Enter invalid email format
      await tester.enterText(find.byType(TextFormField).first, 'invalid-email');
      await tester.tap(find.text('Sign In to Workspace'));
      await tester.pumpAndSettle();

      expect(find.text('Enter a valid corporate email'), findsOneWidget);
    });

    testWidgets('AdminLoginScreen renders master security notice', (
      tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: AdminLoginScreen()));

      expect(find.text('Admin Console / এডমিন লগইন'), findsOneWidget);
      expect(find.text('Executive Operations & ERP'), findsOneWidget);
      expect(find.text('Authenticate Admin Session'), findsOneWidget);
    });

    testWidgets(
      'RoleSelectionScreen displays all 3 roles and navigates to CandidateLoginScreen',
      (tester) async {
        await tester.pumpWidget(const MaterialApp(home: RoleSelectionScreen()));

        expect(find.text('Candidate / Migrant Worker'), findsOneWidget);
        expect(find.text('Recruitment & Processing Staff'), findsOneWidget);
        expect(find.text('Executive Administrator'), findsOneWidget);

        // Tap Candidate Role -> Navigates to CandidateLoginScreen
        await tester.tap(find.text('Candidate / Migrant Worker'));
        await tester.pumpAndSettle();

        expect(find.byType(CandidateLoginScreen), findsOneWidget);
      },
    );
  });
}
