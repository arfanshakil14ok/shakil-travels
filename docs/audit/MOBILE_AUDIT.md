# SHAKIL TRAVELS — Phase 00: Mobile Application Audit
**Audit Date**: October 25, 2026  
**Auditor**: Senior Software Architect & Mobile (Flutter) Lead  
**Component**: Native Flutter 3.x / Dart 3 Mobile Client (`mobile/`)  

---

## 1. Mobile Architecture Overview

The mobile application is a native Flutter client targeting Android and iOS, built as a multi-role companion to the SHAKIL TRAVELS recruitment ERP.

```text
mobile/lib/
├── app/
│   ├── app.dart                                # ShakilTravelsApp widget with MaterialApp & Localization
│   ├── app_router.dart                         # Centralized route table & argument guards
│   └── theme/                                  # Colors, Typography & Theme configurations
├── core/
│   ├── config/ (app_config, environment)       # Multi-environment endpoints (dev, staging, prod)
│   ├── errors/ (api_exception, failure)        # Structured domain errors
│   ├── localization/                           # Bilingual engine (Bangla / English)
│   ├── network/ (api_client, interceptor)      # Dio client, safe logging, dual-auth header injection
│   └── security/ (secure_storage)              # Keystore-backed session persistence
├── features/
│   ├── splash/                                 # Initial token check & automatic redirection
│   ├── auth/                                   # Role selection, Candidate, Staff, and Admin login
│   ├── candidate/                              # Full candidate self-service portal
│   │   ├── data/ (repository, models)          # Candidate DTOs & API integrations
│   │   └── presentation/screens/               # Dashboard, Jobs, Applications, Documents, Payments
│   ├── staff/                                  # Operations staff review & queue screens
│   └── admin/                                  # Executive admin analytics & monitoring
└── shared/widgets/                             # Atomic UI components (buttons, cards, badges, text fields)
```

---

## 2. Navigation & Authentication Flow

### 2.1 Route Map (`AppRouter`)
- `/`: `SplashScreen` — Inspects `SecureStorageService.getActiveAccountType()`:
  - If authenticated as Candidate $\rightarrow$ navigates to `/candidate-dashboard`.
  - If authenticated as Staff $\rightarrow$ navigates to `/staff-dashboard`.
  - If authenticated as Admin $\rightarrow$ navigates to `/admin-dashboard`.
  - If unauthenticated $\rightarrow$ navigates to `/role-select`.
- `/role-select`: `RoleSelectionScreen` — User chooses Candidate, Staff, or Admin portal.
- `/candidate-login`: Identifier (Phone/Applicant ID/Email) + Password.
- `/staff-login`: Official Staff Email + Password.
- `/admin-login`: Executive Admin Email + Password (enforces `SUPER_ADMIN` or `ADMIN` role).
- `/candidate-dashboard`: Bottom-navigation shell hosting Dashboard, Jobs, Applications, Documents, and Payments.

### 2.2 Network & Interceptor Pipeline
- **HTTP Client**: `Dio` configured in `ApiClient` with 30-second timeouts.
- **Interceptors**: `ApiInterceptor` performs three critical operations:
  1. Reads JWT token from `SecureStorageService`.
  2. Sets both `Authorization: Bearer <token>` and `Cookie: <cookieName>=<token>`.
  3. Sanitizes logging outputs via `SafeLogger.sanitize()` to redact passwords, tokens, and PII.
  4. Intercepts HTTP 401 Unauthorized responses to invoke `clearSession()` and notify the router.

---

## 3. Localization & Assets

- **Supported Languages**: Bengali (`bn`) and English (`en`).
- **Asset Catalogs**:
  - `assets/i18n/bn.json` & `assets/i18n/en.json`: Translated UI strings.
  - `assets/brand/`: Vector SVG logos, dark/light variants, and raster icons.
- **Font Stack**: Google Fonts (`Hind Siliguri` for Bengali, `Inter` for English).

---

## 4. Mobile Findings & Defects

### [MOB-001] Missing Dependency Lockfile & Unresolved Packages
- **Severity**: High (P0 Blocker for Mobile CI)
- **Impact**: Neither `pubspec.lock` nor `.dart_tool/package_config.json` exists in `mobile/`. Because dependencies have not been resolved via `flutter pub get` in this environment, tools like `dart analyze` and `flutter test` fail with unresolved import errors for `package:flutter`, `package:dio`, and other packages.
- **File**: `mobile/pubspec.lock` (Missing)
- **Evidence**:
  - `Test-Path mobile/pubspec.lock` returns `False`.
  - Running `dart analyze mobile` outputs thousands of `Target of URI doesn't exist: 'package:flutter/...'` errors.
- **Recommended Fix**: Execute `flutter pub get` in a network-enabled environment or with appropriate sandbox bypass to generate a committed `pubspec.lock` and `.dart_tool/package_config.json`.
- **Required Verification**: Verify `mobile/pubspec.lock` is generated; verify `flutter analyze` runs without unresolved import errors.

---

### [MOB-002] Dart Analyzer Sandboxed Storage Access Conflict
- **Severity**: Medium
- **Impact**: On Windows systems under sandboxed execution, the Dart SDK analyzer attempts to create instrumentation files in `C:\Users\<user>\AppData\Local\.dartServer\`, which causes an `OS Error: Access is denied, errno = 5` crash unless the local app data path is redirected.
- **File**: Environment execution (`dart analyze`)
- **Evidence**: Executing raw `dart analyze mobile` produces:
  `FileSystemException: Exists failed, path = 'C:\Users\...\AppData\Local\.dartServer\.instrumentation' (OS Error: Access is denied)`
- **Recommended Fix**: Configure analyzer invocation scripts to set `$env:LOCALAPPDATA` to a workspace-local scratch cache directory before invoking the analysis server.
- **Required Verification**: Run `dart analyze` with local path redirection; verify analysis starts without crashing on filesystem access.

---

### [MOB-003] Dashboard Routes Lack Graceful Argument Recovery
- **Severity**: Medium
- **Impact**: In `AppRouter.onGenerateRoute`, routes `/candidate-dashboard`, `/staff-dashboard`, and `/admin-dashboard` check `settings.arguments as SessionModel?`. If a route is pushed without arguments (e.g., via deep-link or direct navigation), it redirects back to login even if a valid session exists in `SecureStorageService`.
- **File**: `mobile/lib/app/app_router.dart`, Lines 39-61
- **Evidence**:
  ```dart
  case candidateDashboard:
    final session = settings.arguments as SessionModel?;
    if (session == null || !session.isCandidate) {
      return MaterialPageRoute(builder: (_) => const CandidateLoginScreen());
    }
  ```
- **Recommended Fix**: Implement an asynchronous fallback route or session provider wrapper that attempts to hydrate the active session from `SecureStorageService` before falling back to login.
- **Required Verification**: Test navigating to `/candidate-dashboard` without arguments while a valid session is stored; verify it renders the dashboard.

---

### [MOB-004] Redundant HTTP Package Dependencies
- **Severity**: Low
- **Impact**: `mobile/pubspec.yaml` includes both `dio: ^5.4.0` and `http: ^1.2.0`. The codebase exclusively uses `Dio` throughout `ApiClient` and `ApiInterceptor`, leaving `http` as dead weight in the dependency tree.
- **File**: `mobile/pubspec.yaml`, Line 18
- **Evidence**: `grep` for `package:http/http.dart` in `mobile/lib/` returns 0 usages.
- **Recommended Fix**: Remove `http: ^1.2.0` from `mobile/pubspec.yaml` to minimize binary size and dependency attack surface.
- **Required Verification**: Run `flutter pub get` and verify mobile application compiles without warnings.
