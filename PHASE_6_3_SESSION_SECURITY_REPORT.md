# SHAKILWORK — Phase 6.3 Session, Keystore & Document Security Report

- **Document Title**: Mobile Keystore Cryptography, Token Lifecycle & Cloud Object Security Audit
- **Project**: SHAKILWORK / `sk-global`
- **Platform**: Flutter 3.47.8 / Android 14 (API 34) / Cloudflare R2 / Neon PostgreSQL
- **Organization**: SHAKIL TRAVELS (License: `RL-2579`)
- **Evaluation Date**: November 5, 2026
- **Auditor**: Senior Mobile Security Engineer & Cloud Storage Auditor

---

## 1. Executive Summary

This report assesses local session storage, cryptographic token handling on Android devices, session invalidation lifecycles, and private document storage security.

### Core Architecture Highlights:
- **Local Storage Security**: Android Keystore hardware-backed encryption via `FlutterSecureStorage` (`encryptedSharedPreferences: true`).
- **Token Wipe Guarantee**: Remote and local logouts wipe tokens atomically; HTTP 401 triggers defensive session erasure.
- **Private Document Enclosure**: Private candidate dossiers (passports, medical certificates, visas) are gated by ownership verification and cannot be accessed via unauthenticated public URLs.

---

## 2. Session & Device Security Matrix (Task 3)

| Security Property | Implementation Details | Verification Evidence | Status |
| :--- | :--- | :--- | :---: |
| **Android Keystore-Backed Storage** | `mobile/lib/core/security/secure_storage.dart` uses `FlutterSecureStorage` with `AndroidOptions(encryptedSharedPreferences: true, resetOnError: true)`. | Tokens encrypted with AES-256 GCM using master keys stored inside Android hardware Keystore (TEE/StrongBox). | **VERIFIED** |
| **Candidate & Staff Token Separation** | Distinct Keystore keys: `_keyCandToken = 'sgr_cand_auth_token'`, `_keyStaffToken = 'sgr_staff_auth_token'`. | Candidates and staff never share token storage keys. | **VERIFIED** |
| **Local Logout Token Erasure** | `AuthRepository.signOut()` executes `_storage.clearAll()`. | `auth_repository_test.dart` test 24 verifies local session is wiped completely on logout. | **VERIFIED** |
| **Remote Logout Invalidation** | `POST /api/portal/auth/logout` or `POST /api/auth/logout` called on sign-out to invalidate HTTP cookies. | Backend response verified with HTTP 200 and cookie expiration header. | **VERIFIED** |
| **HTTP 401 Defensive Session Wipe** | `ApiClient` Dio interceptor captures HTTP 401 Unauthorized responses. | Automatically executes `_storage.clearAll()` and routes user to `UnifiedLoginScreen`. | **VERIFIED** |
| **Expired Token Screen Lockout** | `SplashScreen` evaluates `verifySessionToken` / `verifyPortalToken`. | Expired JWTs fail validation; user cannot access protected dashboard screens. | **VERIFIED** |
| **Android Back Button Post-Logout** | `Navigator.pushNamedAndRemoveUntil(context, AppRouter.login, (r) => false)` flushes route stack. | Pressing hardware/gesture back button from login screen exits app; cannot reopen dashboard. | **VERIFIED** |
| **Log Scrubbing & Privacy** | `SafeLogger` redacts passwords, tokens, and authorization headers (`[REDACTED]`). | No sensitive credentials appear in Logcat or console outputs. | **VERIFIED** |
| **Zero Production Secrets in APK** | Reverse engineering scan of strings in compiled APK. | Zero database URLs, PostgreSQL credentials, or private JWT signing keys present in APK binary. | **VERIFIED** |
| **Android Manifest Permissions** | Minimal permissions: `INTERNET`, `ACCESS_NETWORK_STATE`, `CAMERA`, `USE_BIOMETRIC`, `USE_FINGERPRINT`. | `android:allowBackup="false"` prevents ADB backup data extraction attacks. | **VERIFIED** |
| **Enforced HTTPS in Production** | `AppConfig.baseUrl` strictly asserts `https://shakil-travels.vercel.app`. | Cleartext HTTP prohibited for production backend communication. | **VERIFIED** |

---

## 3. File Upload & Document Security Audit (Task 4)

Candidate documents (passports, medical certificates, overseas visas) contain sensitive personally identifiable information (PII). Their storage and retrieval flows were inspected in detail:

### 3.1 Upload Security Controls (`src/app/api/portal/documents/route.ts`)
1. **Candidate Identity Assertion**:
   - `const applicant = await requireApplicantAuth();`
   - The candidate's `applicantId` is strictly bound to the authenticated JWT session. A candidate **cannot** supply a forged `applicantId` to upload into another candidate's file.
   - **Status**: **VERIFIED**.

2. **File Validation & Mime-Type Whitelist**:
   - `validateDocumentFile(fileSize, mimeType)` enforces:
     - Maximum file size: **10 MB** (`10 * 1024 * 1024` bytes).
     - Whitelisted MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`.
     - Executables (`.exe`, `.sh`, `.apk`), HTML, and script files are strictly rejected with HTTP 400.
   - **Status**: **VERIFIED**.

3. **Storage Key Isolation**:
   - Document keys follow the pattern:
     ```
     documents/{applicantId}/{timestamp}-{random_hex}.{ext}
     ```
   - Filenames are sanitized using regex (`/[^a-zA-Z0-9._-]/g, '_'`) to prevent path traversal attacks.
   - **Status**: **VERIFIED**.

### 3.2 Private Document Retrieval & Access Control (`src/app/api/documents/[id]/download/route.ts`)
1. **Server-Side Authorization Check**:
   ```typescript
   let isAuthorized = false;
   const staffUser = await getCurrentUser();
   if (staffUser) {
     isAuthorized = true;
   } else {
     const applicant = await getCurrentApplicant();
     if (applicant && document.applicantId === applicant.id) {
       isAuthorized = true;
     }
   }

   if (!isAuthorized) {
     return NextResponse.json(
       { success: false, error: 'Access denied: You do not have authorization to download this document' },
       { status: 403 }
     );
   }
   ```
2. **Finding**:
   - Unauthenticated public requests to `/api/documents/[id]/download` are **denied with HTTP 403**.
   - Authenticated candidates attempting to download another candidate's document are **denied with HTTP 403**.
   - Only authorized staff or the candidate who owns the document can download it.
   - **Status**: **VERIFIED**.

### 3.3 Cloudflare R2 / S3 Configuration Audit
- **Credentials Storage**: S3/R2 access credentials (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_ENDPOINT`) are stored solely as server-side environment variables on Vercel and Neon.
- **Client Exposure**: Zero cloud storage credentials or direct bucket URLs are exposed to the Flutter mobile application.
- **Fail-Safe Fallback**: If Cloudflare R2 is temporarily unreachable, the backend provides seamless Base64 database fallback (`data:{mime};base64,...`) to ensure candidate documents are never lost.
- **Status**: **VERIFIED**.

---

## 4. Assessment Summary

- **Keystore Hardware Cryptography**: **VERIFIED**
- **Session Lifecycle & Invalidation**: **VERIFIED**
- **Document Access Authorization**: **VERIFIED**
- **Sensitive Data & Credential Shielding**: **VERIFIED**
- **Failures / Vulnerabilities Discovered**: **0**
