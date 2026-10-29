import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class NotificationItem {
  final String id;
  final String title;
  final String message;
  final DateTime timestamp;
  final bool isRead;
  final String category; // 'TRACKING', 'JOB', 'SYSTEM'
  final String? relatedCode;

  const NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.timestamp,
    this.isRead = false,
    this.category = 'SYSTEM',
    this.relatedCode,
  });

  NotificationItem copyWith({bool? isRead}) {
    return NotificationItem(
      id: id,
      title: title,
      message: message,
      timestamp: timestamp,
      isRead: isRead ?? this.isRead,
      category: category,
      relatedCode: relatedCode,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'message': message,
      'timestamp': timestamp.toIso8601String(),
      'isRead': isRead,
      'category': category,
      'relatedCode': relatedCode,
    };
  }

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      timestamp: DateTime.tryParse(json['timestamp']?.toString() ?? '') ?? DateTime.now(),
      isRead: json['isRead'] == true,
      category: json['category']?.toString() ?? 'SYSTEM',
      relatedCode: json['relatedCode']?.toString(),
    );
  }
}

class NotificationService extends ChangeNotifier {
  static const String _storageKey = 'shakil_notifications_v1';
  List<NotificationItem> _notifications = [];

  List<NotificationItem> get notifications => List.unmodifiable(_notifications);
  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  NotificationService() {
    loadNotifications();
  }

  Future<void> loadNotifications() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);
      if (raw != null && raw.isNotEmpty) {
        final List<dynamic> list = jsonDecode(raw);
        _notifications = list.map((e) => NotificationItem.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        // Initial welcome & sample deployment notifications
        _notifications = [
          NotificationItem(
            id: 'notif_1',
            title: 'ভিসা প্রসেসিং স্ট্যাটাস আপডেট',
            message: 'পাসপোর্ট A01234567 এর সৌদি দূতাবাস ভিসা স্ট্যাম্পিং প্রসেস শুরু হয়েছে।',
            timestamp: DateTime.now().subtract(const Duration(hours: 3)),
            isRead: false,
            category: 'TRACKING',
            relatedCode: 'A01234567',
          ),
          NotificationItem(
            id: 'notif_2',
            title: 'নতুন নিয়োগ বিজ্ঞপ্তি প্রকাশিত',
            message: 'কাতারের নামকরা চেইনে ২৫ জন রেস্তোরাঁ সার্ভিস ক্রু নিয়োগ চলছে।',
            timestamp: DateTime.now().subtract(const Duration(days: 1)),
            isRead: false,
            category: 'JOB',
          ),
          NotificationItem(
            id: 'notif_3',
            title: 'শাকিল ট্রাভেলস অ্যাপে স্বাগতম',
            message: 'সরকারি অনুমোদনপ্রাপ্ত RL-2579 এজেন্সির মাধ্যমে নিরাপদ ও বৈধ অভিবাসন গ্রহণ করুন।',
            timestamp: DateTime.now().subtract(const Duration(days: 2)),
            isRead: true,
            category: 'SYSTEM',
          ),
        ];
        _persist();
      }
      notifyListeners();
    } catch (_) {}
  }

  Future<void> addNotification({
    required String title,
    required String message,
    String category = 'SYSTEM',
    String? relatedCode,
  }) async {
    final item = NotificationItem(
      id: 'notif_${DateTime.now().millisecondsSinceEpoch}',
      title: title,
      message: message,
      timestamp: DateTime.now(),
      isRead: false,
      category: category,
      relatedCode: relatedCode,
    );
    _notifications.insert(0, item);
    await _persist();
    notifyListeners();
  }

  Future<void> markAllAsRead() async {
    _notifications = _notifications.map((n) => n.copyWith(isRead: true)).toList();
    await _persist();
    notifyListeners();
  }

  Future<void> _persist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final encoded = jsonEncode(_notifications.map((n) => n.toJson()).toList());
      await prefs.setString(_storageKey, encoded);
    } catch (_) {}
  }
}
