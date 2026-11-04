import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shakil_travels/core/config/app_config.dart';
import 'package:shakil_travels/core/network/api_client.dart';
import 'package:shakil_travels/features/home/presentation/home_screen.dart';

class MockHttpAdapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return ResponseBody.fromString(
      jsonEncode({'status': 'healthy', 'service': 'SHAKIL TRAVELS ERP'}),
      200,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  testWidgets('App starts with ShakilTravelsApp and renders Home Screen', (
    WidgetTester tester,
  ) async {
    FlutterSecureStorage.setMockInitialValues({});
    final dio = Dio(BaseOptions(baseUrl: 'http://test.local'));
    dio.httpClientAdapter = MockHttpAdapter();
    final apiClient = ApiClient(dio: dio);

    await tester.pumpWidget(
      MaterialApp(
          home: HomeScreen(hasActiveSession: false, apiClient: apiClient)),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    // Verify Official Branding
    expect(find.text(AppConfig.appName), findsOneWidget);
    expect(find.text('Govt. Approved RL-2579'), findsOneWidget);
    expect(find.text('Quick Application Tracking'), findsOneWidget);
    expect(find.text('Official Office Helpline'), findsOneWidget);
  });
}
