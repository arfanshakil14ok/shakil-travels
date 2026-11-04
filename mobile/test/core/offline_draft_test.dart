import 'package:flutter_test/flutter_test.dart';
import 'package:shakil_travels/core/offline/offline_draft_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('OfflineDraftService Tests', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    test('saveDraftApplication and getDraftApplications work correctly', () async {
      final service = OfflineDraftService();
      final draft = {
        'id': 'draft_101',
        'jobId': 'job_saudi_welder',
        'fullName': 'Shakil Ahmed',
        'phone': '01913681771',
      };

      final saved = await service.saveDraftApplication(draft);
      expect(saved, isTrue);

      final drafts = await service.getDraftApplications();
      expect(drafts.length, equals(1));
      expect(drafts.first['fullName'], equals('Shakil Ahmed'));
      expect(drafts.first['jobId'], equals('job_saudi_welder'));

      final deleted = await service.deleteDraftApplication('draft_101');
      expect(deleted, isTrue);

      final emptyDrafts = await service.getDraftApplications();
      expect(emptyDrafts, isEmpty);
    });

    test('queueDocumentUpload and removeQueuedUpload work correctly', () async {
      final service = OfflineDraftService();
      final upload = {
        'id': 'up_202',
        'documentTypeId': 'doc_passport',
        'filePath': '/storage/mock/passport.pdf',
        'fileName': 'passport.pdf',
      };

      final queued = await service.queueDocumentUpload(upload);
      expect(queued, isTrue);

      final queue = await service.getQueuedUploads();
      expect(queue.length, equals(1));
      expect(queue.first['fileName'], equals('passport.pdf'));

      final removed = await service.removeQueuedUpload('up_202');
      expect(removed, isTrue);

      final afterQueue = await service.getQueuedUploads();
      expect(afterQueue, isEmpty);
    });
  });
}
