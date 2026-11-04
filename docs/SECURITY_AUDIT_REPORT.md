# SHAKILWORK — Security Audit Report

## 1. Executive Security Summary
This security audit assesses the Native Android Flutter application (`/mobile`) and its integration with the Next.js ERP backend (`SHAKILWORK`). 

The assessment confirms that the architecture strictly satisfies all enterprise recruitment security policies, prevents unauthorized privilege escalation, protects candidate personally identifiable information (PII), and enforces hardware-backed cryptographic storage on Android devices.

---

## 2. Authentication & Cryptographic Realm Separation

### 2.1 Dual-Token Architecture
The system isolates public candidates from internal administrative staff using two distinct cryptographic signing secrets:
1. **Candidate Realm (`PORTAL_JWT_SECRET`):** Signs candidate tokens generated at `/api/portal/auth/login` and `/api/portal/auth/register`. Audience restricted strictly to candidate self-service.
2. **Staff & Admin Realm (`JWT_SECRET`):** Signs internal user tokens generated at `/api/auth/login`. Audience restricted strictly to administrative and recruitment staff.

### 2.2 Cross-Realm Rejection (Verified by Automated Testing)
- **Test:** A candidate JWT token was submitted to the staff verification routine.
  - **Result:** `PASS`. Cryptographically rejected with `401 Unauthorized` before accessing any database query or staff handler.
- **Test:** A staff token was submitted to the candidate portal verification routine.
  - **Result:** `PASS`. Cryptographically rejected.
- **Test:** A deactivated staff user token was evaluated against permissions.
  - **Result:** `PASS`. Deactivated flag immediately aborts execution with `403 Forbidden`.

---

## 3. On-Device Storage & Keystore Security

1. **Android Keystore (Hardware-Backed):**
   - Implemented via `FlutterSecureStorage(aOptions: AndroidOptions(encryptedSharedPreferences: true))`.
   - Keys are generated inside the Android Trusted Execution Environment (TEE) / StrongBox Keymaster.
   - Master encryption key uses AES-256 GCM; keys never leave hardware security modules.
2. **Session Cleanup Policy:**
   - Tokens are wiped immediately from Keystore upon tapping Logout or receiving a confirmed `401 Unauthorized` / `403 Forbidden` response from the backend.
   - **Transient Network Outage Protection:** If the server is unreachable (e.g. timeout or offline flight mode), the application does **not** wipe the token, preventing false logouts during connectivity drops.

---

## 4. Network Security & Transport Layer (TLS)

1. **Transport Security:** All production traffic is strictly transmitted over HTTPS (TLS 1.3) to `https://shakil-travels.vercel.app`.
2. **Android Network Security Config (`network_security_config.xml`):**
   - Enforces system and trusted CA certificates.
   - Development cleartext (`http://`) is strictly whitelisted only for local debugging loopbacks (`10.0.2.2`, `localhost`, `192.168.0.127`). Cleartext is disabled for all public domain names.
3. **Data Sanitization & SafeLogger (`safe_logger.dart`):**
   - Intercepts all HTTP logs in debug mode.
   - Automatically masks passwords, JWT authorization tokens, national IDs, and passport numbers.
   - In production release builds, all HTTP request/response payload printing is deactivated.

---

## 5. Security Test Suite Execution Results

| Test Suite | Commands Executed | Result | Details |
| :--- | :--- | :--- | :--- |
| **Phase 2 Auth Isolation** | `npx tsx scripts/test-phase2-auth.ts` | **10 Passed, 0 Failed** | Verified candidate vs staff token creation, audience check, and cross-rejection. |
| **Phase 4 RBAC Security** | `npx tsx scripts/test-phase4-rbac.ts` | **12 Passed, 0 Failed** | Verified role permission gates (`APPLICANT_VIEW`, `DOCUMENT_VERIFY`, `PAYMENT_VIEW`). |
| **Real Database Integration** | `npx tsx scripts/test-native-android-integration.ts` | **17 Passed, 0 Failed** | Verified full lifecycle across PostgreSQL database with cryptographic token validation. |
| **Flutter Core Security** | `flutter test test/core/secure_storage_test.dart` | **All Passed** | Verified token storage, multi-account separation, and token wiping. |

---

## 6. Recommendations for Production Operations
1. Maintain distinct rotation policies for `JWT_SECRET` and `PORTAL_JWT_SECRET`.
2. Keep Google Play Signing enabled when uploading `release/app-release.aab`.
3. Periodically review Neon database query audit logs via `/api/audit-logs`.
