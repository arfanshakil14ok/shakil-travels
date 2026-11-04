import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../network/safe_logger.dart';

class OfflineDraftService {
  static const String _kDraftApplicationsKey = 'offline_draft_applications';
  static const String _kQueuedUploadsKey = 'offline_queued_uploads';

  final SharedPreferences? _prefs;

  OfflineDraftService({SharedPreferences? prefs}) : _prefs = prefs;

  Future<SharedPreferences> _getPrefs() async {
    return _prefs ?? await SharedPreferences.getInstance();
  }

  /// Save an offline application draft
  Future<bool> saveDraftApplication(Map<String, dynamic> draft) async {
    try {
      final p = await _getPrefs();
      final drafts = await getDraftApplications();
      
      final draftId = draft['id'] ?? 'draft_${DateTime.now().millisecondsSinceEpoch}';
      draft['id'] = draftId;
      draft['savedAt'] = DateTime.now().toIso8601String();

      // Replace existing draft with same ID or prepend
      final index = drafts.indexWhere((d) => d['id'] == draftId);
      if (index >= 0) {
        drafts[index] = draft;
      } else {
        drafts.insert(0, draft);
      }

      final encoded = jsonEncode(drafts);
      return await p.setString(_kDraftApplicationsKey, encoded);
    } catch (e) {
      SafeLogger.warn('Failed to save offline application draft: $e');
      return false;
    }
  }

  /// Retrieve all stored application drafts
  Future<List<Map<String, dynamic>>> getDraftApplications() async {
    try {
      final p = await _getPrefs();
      final raw = p.getString(_kDraftApplicationsKey);
      if (raw == null || raw.isEmpty) return [];

      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((item) => Map<String, dynamic>.from(item as Map)).toList();
    } catch (e) {
      SafeLogger.warn('Failed to read offline drafts: $e');
      return [];
    }
  }

  /// Delete a single draft
  Future<bool> deleteDraftApplication(String draftId) async {
    try {
      final p = await _getPrefs();
      final drafts = await getDraftApplications();
      drafts.removeWhere((d) => d['id'] == draftId);
      return await p.setString(_kDraftApplicationsKey, jsonEncode(drafts));
    } catch (e) {
      SafeLogger.warn('Failed to delete draft: $e');
      return false;
    }
  }

  /// Queue an offline document upload for automatic retry
  Future<bool> queueDocumentUpload(Map<String, dynamic> uploadItem) async {
    try {
      final p = await _getPrefs();
      final uploads = await getQueuedUploads();

      final uploadId = uploadItem['id'] ?? 'upload_${DateTime.now().millisecondsSinceEpoch}';
      uploadItem['id'] = uploadId;
      uploadItem['queuedAt'] = DateTime.now().toIso8601String();

      uploads.add(uploadItem);
      return await p.setString(_kQueuedUploadsKey, jsonEncode(uploads));
    } catch (e) {
      SafeLogger.warn('Failed to queue offline upload: $e');
      return false;
    }
  }

  /// Retrieve pending uploads
  Future<List<Map<String, dynamic>>> getQueuedUploads() async {
    try {
      final p = await _getPrefs();
      final raw = p.getString(_kQueuedUploadsKey);
      if (raw == null || raw.isEmpty) return [];

      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((item) => Map<String, dynamic>.from(item as Map)).toList();
    } catch (e) {
      SafeLogger.warn('Failed to read queued uploads: $e');
      return [];
    }
  }

  /// Remove a completed upload item from queue
  Future<bool> removeQueuedUpload(String uploadId) async {
    try {
      final p = await _getPrefs();
      final uploads = await getQueuedUploads();
      uploads.removeWhere((u) => u['id'] == uploadId);
      return await p.setString(_kQueuedUploadsKey, jsonEncode(uploads));
    } catch (e) {
      SafeLogger.warn('Failed to remove queued upload: $e');
      return false;
    }
  }
}
