# SHAKIL TRAVELS — Android Native Application (mobile/)

Official Android mobile client for the **SHAKIL TRAVELS** Overseas Recruitment & Manpower ERP.

---

## 1. Project Configuration

- **App Name:** SHAKIL TRAVELS
- **Android Display Name:** SHAKIL TRAVELS
- **Android Package ID:** `com.shakiltravels.app`
- **Recruiting License:** RL-1892
- **Helpline Phone:** +880 1913-681771
- **Target OS:** Android (Min SDK: 21, Target SDK: 34)
- **Framework:** Flutter 3.x with Dart 3.x

---

## 2. Architecture & Directory Structure

```
mobile/
├── android/                   # Native Android wrapper & Manifest (com.shakiltravels.app)
│   ├── app/
│   │   ├── build.gradle       # MinSDK 21, TargetSDK 34, MultiDex, ProGuard
│   │   └── src/main/
│   │       ├── AndroidManifest.xml # Label: SHAKIL TRAVELS, Permissions
│   │       └── res/xml/
│   │           └── network_security_config.xml # TLS 1.3 enforcement + Emulator debug override
│   ├── build.gradle
│   └── settings.gradle
├── assets/
│   ├── brand/                 # Official SHAKIL TRAVELS vector logos and marks
│   └── i18n/                  # Bilingual localization (English & Bengali)
│       ├── bn.json
│       └── en.json
├── lib/
│   ├── main.dart              # App entry point
│   ├── app/
│   │   ├── app.dart           # MaterialApp root with Material 3 Theme & Localizations
│   │   ├── app_router.dart    # Declarative Named Route Generator
│   │   └── theme/             # Corporate Palette (#102B50 Navy, #E8A2C1 Pink, #F6F8FB Page)
│   ├── core/
│   │   ├── config/            # Environment manager (Emulator, Physical LAN, Production)
│   │   ├── errors/            # Typed ApiExceptions & domain Failures
│   │   ├── localization/      # Dynamic runtime Bengali/English switcher
│   │   ├── network/           # ApiClient, ApiEndpoints, ApiInterceptor, SafeLogger
│   │   └── security/          # SecureStorageService backed by Android Keystore (AES-GCM)
│   ├── features/
│   │   ├── auth/              # Candidate & Staff session models & AuthRepository
│   │   ├── home/              # Recruitment business dashboard & tracking box
│   │   └── splash/            # Animated brand splash & session restoration
│   └── shared/
│       └── widgets/           # AppButton, AppCard, AppLogo, ErrorView, StatusBadge
├── test/
│   ├── core/
│   │   ├── config_test.dart
│   │   ├── api_client_test.dart
│   │   └── safe_logger_test.dart
│   └── widget_test.dart
└── pubspec.yaml
```

---

## 3. Network Configuration & Device Networking Guide

The mobile application connects directly to the existing Next.js ERP backend (`SHAKILWORK`).

### 3.1 Android Emulator Networking
Android emulators run on an isolated virtual network behind a virtual router.
- **Loopback address:** `http://10.0.2.2:3000`
- `10.0.2.2` maps directly to `localhost:3000` on your development PC.
- This is configured by default in `AppConfig` when `devHostMode: DevHostMode.androidEmulator`.

### 3.2 Physical Android Device Networking
When running on a real Android phone over Wi-Fi:
1. Ensure your phone and development PC are connected to the **same local Wi-Fi router**.
2. Find your PC's local IP address (run `ipconfig` in PowerShell, e.g. `192.168.1.150`).
3. Set `devHostMode: DevHostMode.physicalDeviceLan` and pass `customLanIp: '192.168.1.150'` in `lib/main.dart`:
   ```dart
   AppConfig.initialize(
     const AppConfig(
       environment: EnvironmentType.development,
       devHostMode: DevHostMode.physicalDeviceLan,
       customLanIp: '192.168.1.150', // Replace with your computer's LAN IP
     ),
   );
   ```

### 3.3 Production HTTPS
In production, `EnvironmentType.production` enforces TLS 1.3 HTTPS (`https://...`). Cleartext HTTP traffic is blocked at the Android operating system level via `network_security_config.xml`.

---

## 4. Security & Sensitive Data Policy

1. **Android Keystore Encryption:** Tokens and session identifiers are stored in `flutter_secure_storage` using hardware-backed AES-256 GCM encryption.
2. **Safe Logging:** `SafeLogger` sanitizes all request/response dumps in debug mode, automatically redacting passwords, JWT tokens, OTPs, and candidate personal data.
3. **Dual Session Compatibility:** `ApiInterceptor` automatically transmits `Authorization: Bearer <token>` alongside `Cookie: sgr_session=<token>` / `Cookie: sgr_portal_session=<token>`, guaranteeing compatibility with both header-based and cookie-based backend endpoints.
4. **Zero Embedded Backend Secrets:** No database credentials or server JWT secrets are present in the mobile application.

---

## 5. Development Environment & Build Requirements

To run, analyze, test, and build the APK:

### Prerequisites:
1. **Flutter SDK:** Version 3.16+ (Dart 3.2+)
   - Download from: https://docs.flutter.dev/get-started/install/windows/mobile
   - Add Flutter `bin/` to system `PATH`.
2. **Java Development Kit (JDK):** JDK 17 (recommended for Gradle 8)
   - Microsoft OpenJDK 17 or Eclipse Temurin 17.
3. **Android SDK & Build Tools:**
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Set environment variable `ANDROID_HOME` (e.g. `C:\Users\<user>\AppData\Local\Android\Sdk`).

### Commands:
```bash
# 1. Navigate to the mobile directory
cd mobile

# 2. Fetch dependencies
flutter pub get

# 3. Run static analysis
flutter analyze

# 4. Run automated test suite
flutter test

# 5. Build Debug APK
flutter build apk --debug
```
The output APK is generated at: `mobile/build/app/outputs/flutter-apk/app-debug.apk`.
