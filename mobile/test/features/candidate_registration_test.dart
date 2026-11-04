import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shakil_travels/features/auth/presentation/candidate_register_screen.dart';

void main() {
  group('CandidateRegisterScreen UI & Validation Tests', () {
    testWidgets('CandidateRegisterScreen renders properly and validates form fields', (
      tester,
    ) async {
      // Set test viewport size to 800x1200 so full form is in view
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const MaterialApp(home: CandidateRegisterScreen()),
      );

      // Verify Screen Elements
      expect(find.text('প্রার্থী নিবন্ধন (Registration)'), findsOneWidget);
      expect(find.text('সম্পূর্ণ নাম (Full Name)'), findsOneWidget);
      expect(find.text('মোবাইল নম্বর (Phone Number)'), findsOneWidget);
      expect(find.text('পাসওয়ার্ড (Password)'), findsOneWidget);
      expect(find.text('পাসওয়ার্ড নিশ্চিত করুন'), findsOneWidget);

      final submitBtn = find.text('নিবন্ধন সম্পন্ন করুন');
      expect(submitBtn, findsOneWidget);
      await tester.ensureVisible(submitBtn);

      // Submit empty form -> Triggers validation errors
      await tester.tap(submitBtn);
      await tester.pumpAndSettle();

      expect(find.text('সম্পূর্ণ নাম লিখুন (কমপক্ষে ২ অক্ষর)'), findsOneWidget);
      expect(find.text('সঠিক মোবাইল নম্বর প্রদান করুন'), findsOneWidget);
      expect(find.text('কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন'), findsOneWidget);
    });
  });
}
