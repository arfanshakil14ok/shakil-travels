import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static const List<Locale> supportedLocales = [
    Locale('en', 'US'),
    Locale('bn', 'BD'),
  ];

  late Map<String, String> _localizedStrings;

  // Fallback in-memory map to guarantee zero crash in tests or asset load issues
  static final Map<String, Map<String, String>> _fallbackStrings = {
    'en': {
      'app_name': 'SHAKIL TRAVELS',
      'app_tagline': 'Trusted Overseas Recruitment & Government Approved Manpower Agency',
      'license_notice': 'Govt. Approved RL-1892',
      'welcome_title': 'Welcome to SHAKIL TRAVELS',
      'welcome_subtitle': 'Select your portal role to access recruitment services and track your overseas journey.',
      'role_candidate': 'Candidate / Migrant Worker',
      'role_candidate_desc': 'Track applications, view visa status, and upload documents',
      'role_staff': 'Recruitment & Processing Staff',
      'role_staff_desc': 'Review dossiers, verify documents, and manage stages',
      'role_admin': 'Executive Administrator',
      'role_admin_desc': 'System oversight, accounts summary, and operational reports',
      'btn_continue': 'Continue',
      'btn_retry': 'Retry Connection',
      'btn_login': 'Login to Portal',
      'btn_back': 'Back',
      'status_online': 'Connected to ERP',
      'status_offline': 'No internet connection detected',
      'status_server_unreachable': 'Cannot reach backend server. Check network connection.',
      'quick_tracking_title': 'Quick Application Tracking',
      'quick_tracking_hint': 'Enter Passport Number or Application ID',
      'quick_tracking_btn': 'Check Status',
      'contact_helpline': 'Official Helpline: +880 1913-681771',
      'footer_copyright': '© 2026 SHAKIL TRAVELS. All rights reserved.',
    },
    'bn': {
      'app_name': 'শাকিল ট্রাভেলস',
      'app_tagline': 'বিশ্বস্ত বৈদেশিক কর্মসংস্থান ও সরকার অনুমোদিত জনশক্তি রপ্তানিকারক প্রতিষ্ঠান',
      'license_notice': 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত রিক্রুটিং লাইসেন্স: আরএল-১৮৯২',
      'welcome_title': 'শাকিল ট্রাভেলস-এ স্বাগতম',
      'welcome_subtitle': 'আপনার রিক্রুটমেন্ট সেবা গ্রহণ এবং প্রবাস যাত্রার স্ট্যাটাস ট্র্যাক করতে আপনার রোল নির্বাচন করুন।',
      'role_candidate': 'প্রার্থী / অভিবাসী কর্মী',
      'role_candidate_desc': 'আবেদন অগ্রগতি দেখুন, ভিসা স্ট্যাটাস ট্র্যাক করুন ও ডকুমেন্ট জমা দিন',
      'role_staff': 'প্রসেসিং ও রিক্রুটমেন্ট কর্মকর্তা',
      'role_staff_desc': 'আবেদন যাচাই, কাগজপত্র নিরীক্ষা ও ডিপ্লোয়মেন্ট ধাপ পরিচালনা',
      'role_admin': 'এডমিন ও নির্বাহী ব্যবস্থাপনা',
      'role_admin_desc': 'সার্বিক সিস্টেম নিয়ন্ত্রণ, হিসাব নিরীক্ষণ ও অপারেশন রিপোর্ট',
      'btn_continue': 'এগিয়ে যান',
      'btn_retry': 'পুনরায় চেষ্টা করুন',
      'btn_login': 'পোর্টালে লগইন করুন',
      'btn_back': 'ফিরে যান',
      'status_online': 'ইআরপি সিস্টেমের সাথে সংযুক্ত',
      'status_offline': 'কোনো ইন্টারনেট সংযোগ নেই',
      'status_server_unreachable': 'সার্ভারে সংযোগ করা যায়নি। নেটওয়ার্ক চেক করুন।',
      'quick_tracking_title': 'দ্রুত আবেদন ট্র্যাকিং',
      'quick_tracking_hint': 'পাসপোর্ট নম্বর বা আবেদন আইডি লিখুন',
      'quick_tracking_btn': 'স্ট্যাটাস দেখুন',
      'contact_helpline': 'অফিসিয়াল হেল্পলাইন: ০১৯১৩-৬৮১৭১',
      'footer_copyright': '© ২০২৬ শাকিল ট্রাভেলস। সর্বস্বত্ব সংরক্ষিত।',
    },
  };

  Future<bool> load() async {
    try {
      final jsonString = await rootBundle.loadString(
        'assets/i18n/${locale.languageCode}.json',
      );
      final Map<String, dynamic> jsonMap = json.decode(jsonString);
      _localizedStrings = jsonMap.map(
        (key, value) => MapEntry(key, value.toString()),
      );
      return true;
    } catch (_) {
      // Graceful fallback to static map
      _localizedStrings = _fallbackStrings[locale.languageCode] ?? _fallbackStrings['en']!;
      return true;
    }
  }

  String translate(String key) {
    return _localizedStrings[key] ??
        _fallbackStrings['en']?[key] ??
        key;
  }
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'bn'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    final localizations = AppLocalizations(locale);
    await localizations.load();
    return localizations;
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
