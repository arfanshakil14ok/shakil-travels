import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shakil_travels/app/app.dart';
import 'package:shakil_travels/core/config/app_config.dart';
import 'package:shakil_travels/features/home/presentation/home_screen.dart';

void main() {
  testWidgets('App starts with ShakilTravelsApp and renders Home Screen', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: HomeScreen(hasActiveSession: false),
      ),
    );

    await tester.pump();

    // Verify Official Branding
    expect(find.text(AppConfig.appName), findsOneWidget);
    expect(find.text('Govt. Approved RL-1892'), findsOneWidget);
    expect(find.text('Quick Application Tracking'), findsOneWidget);
    expect(find.text('Official Office Helpline'), findsOneWidget);
  });
}
