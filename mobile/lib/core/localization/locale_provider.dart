import 'package:flutter/material.dart';

class LocaleProvider extends ChangeNotifier {
  Locale _locale = const Locale('bn', 'BD'); // Default to Bangla for Bangladeshi workforce

  Locale get locale => _locale;

  bool get isBangla => _locale.languageCode == 'bn';

  void setLocale(Locale locale) {
    if (_locale != locale) {
      _locale = locale;
      notifyListeners();
    }
  }

  void toggleLocale() {
    if (_locale.languageCode == 'bn') {
      _locale = const Locale('en', 'US');
    } else {
      _locale = const Locale('bn', 'BD');
    }
    notifyListeners();
  }
}
