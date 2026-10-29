import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config/app_config.dart';

class SupportLauncher {
  /// Opens WhatsApp chat with official helpline number and optional custom message.
  static Future<bool> openWhatsApp({
    BuildContext? context,
    String? message,
    String phone = AppConfig.helplinePhone,
  }) async {
    // Format phone: remove + or spaces
    final cleanPhone = phone.replaceAll(RegExp(r'[\s+]'), '');
    final encodedMsg = Uri.encodeComponent(message ?? 'আসসালামু আলাইকুম, আমি শাকিল ট্রাভেলস অ্যাপ থেকে যোগাযোগ করছি।');
    final uri = Uri.parse('https://wa.me/$cleanPhone?text=$encodedMsg');

    try {
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched && context != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('হোয়াটসঅ্যাপ খোলা সম্ভব হয়নি। অনুগ্রহ করে নম্বরটি সেভ করে যোগাযোগ করুন।')),
        );
      }
      return launched;
    } catch (_) {
      if (context != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('হোয়াটসঅ্যাপ চালু করা যাচ্ছে না।')),
        );
      }
      return false;
    }
  }

  /// Launches native phone dialer with official helpline.
  static Future<bool> callHelpline({
    BuildContext? context,
    String phone = AppConfig.helplinePhone,
  }) async {
    final uri = Uri.parse('tel:$phone');
    try {
      final launched = await launchUrl(uri);
      if (!launched && context != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('কল করা যাচ্ছে না: $phone')),
        );
      }
      return launched;
    } catch (_) {
      if (context != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('কল ডায়ালার খোলা যায়নি: $phone')),
        );
      }
      return false;
    }
  }

  /// Shares a job circular: copies formatted text to clipboard and opens WhatsApp share.
  static Future<void> shareJob({
    BuildContext? context,
    required String title,
    required String countryName,
    required String jobCode,
    String? salary,
    String? employer,
  }) async {
    final buffer = StringBuffer();
    buffer.writeln('✈️ শাকিল ট্রাভেলস (অনুমোদিত RL-2579)');
    buffer.writeln('চলমান বৈদেশিক নিয়োগ বিজ্ঞপ্তি:');
    buffer.writeln('📌 পদবী: $title');
    buffer.writeln('🌍 দেশ: $countryName');
    if (employer != null && employer.isNotEmpty) {
      buffer.writeln('🏢 প্রতিষ্ঠান: $employer');
    }
    if (salary != null && salary.isNotEmpty) {
      buffer.writeln('💰 আনুমানিক বেতন: $salary');
    }
    buffer.writeln('🔖 জব কোড: $jobCode');
    buffer.writeln('');
    buffer.writeln('📞 সরাসরি যোগাযোগ: ${AppConfig.helplineDisplay}');
    buffer.writeln('📍 অফিস: ইসলামপুর মোড়, ডায়াবেটিস হাসপাতালের সামনে, নেত্রকোনা।');

    final text = buffer.toString();
    await Clipboard.setData(ClipboardData(text: text));

    final encoded = Uri.encodeComponent(text);
    final waUri = Uri.parse('https://api.whatsapp.com/send?text=$encoded');
    try {
      final launched = await launchUrl(waUri, mode: LaunchMode.externalApplication);
      if (!launched && context != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('নিয়োগ বিজ্ঞপ্তি ক্লিপবোর্ডে কপি করা হয়েছে!')),
        );
      }
    } catch (_) {
      if (context != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('নিয়োগ বিজ্ঞপ্তি ক্লিপবোর্ডে কপি করা হয়েছে!')),
        );
      }
    }
  }
}
