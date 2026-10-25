import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import '../core/config/app_config.dart';
import '../core/localization/app_localizations.dart';
import 'app_router.dart';
import 'theme/app_theme.dart';

class ShakilTravelsApp extends StatelessWidget {
  final Locale? initialLocale;

  const ShakilTravelsApp({super.key, this.initialLocale});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      initialRoute: AppRouter.splash,
      onGenerateRoute: AppRouter.onGenerateRoute,
      locale: initialLocale ?? const Locale('bn', 'BD'), // Default to Bengali
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
    );
  }
}
