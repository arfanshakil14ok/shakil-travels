# SHAKILWORK — Known Limitations & Remaining Issues

This document records architectural observations, optional third-party service dependencies, and post-launch considerations for the **SHAKILWORK Native Android Application**.

---

## 1. Firebase Cloud Messaging (FCM) Production Credential
- **Current Behavior:** The mobile application uses `NotificationService` for in-app alert dialogs, periodic notification polling from `/api/portal/notifications`, and local status updates.
- **Production Setup Consideration:** To enable system tray background push notifications when the application is completely closed, the agency must download their `google-services.json` from the [Firebase Console](https://console.firebase.google.com) and place it in `mobile/android/app/google-services.json`.
- **Impact:** Low. All notifications are fully operational inside the app and synchronizing with the database.

---

## 2. File Upload Size Limits via Serverless Functions
- **Current Behavior:** Document uploads up to 10MB are accepted via `POST /api/portal/documents`.
- **Production Consideration:** Vercel serverless functions enforce a 4.5MB request body limit on standard plans if files are sent directly through the Next.js API route without chunking. For files larger than 5MB, pre-signed upload URLs directly to Cloudflare R2 are supported by `@/lib/storage`.
- **Impact:** Minimal for standard documents (passport scans and ID cards are typically 300KB – 2MB).

---

## 3. iOS Multiplatform Compilation
- **Current Behavior:** The mobile application codebase is written in 100% platform-agnostic Flutter and Dart. All dependencies (`dio`, `flutter_secure_storage`, `flutter_bloc`, `image_picker`, `file_picker`, `local_auth`) support iOS.
- **Platform Constraint:** Compiling an iOS `.ipa` or distributing via Apple TestFlight requires macOS with Xcode and an active Apple Developer Program account.
- **Impact:** Zero impact on Android deployment. The Android APK and AAB are fully compiled and ready for release.

---

## 4. Keystore & Google Play App Signing
- **Keystore Stored:** `release/app-release.apk` is signed and immediately installable on physical Android devices.
- **Keystore Backup:** The original production keystore is securely preserved at `.keystore_backup/shakil-travels-release.keystore` and `mobile/shakil-travels-release.keystore`.
- **Google Play:** For Google Play Console publication, upload `release/app-release.aab` and allow Google Play App Signing to manage the distribution keys.
