# SHAKILWORK — Real Integration Test Report

## 1. Test Overview & Objectives
This report documents the end-to-end integration tests conducted to verify real-time data synchronization between the **Web ERP platform** (`https://shakil-travels.vercel.app`), the **Neon PostgreSQL database**, and the **Native Android Mobile Application** (`/mobile`).

Testing was executed against real database records using Prisma ORM, verified HTTP endpoints, and Dart unit/widget test runners.

---

## 2. Real Integration Test Execution (`test-native-android-integration.ts`)

**Test Command:** `npx tsx scripts/test-native-android-integration.ts`  
**Execution Timestamp:** 2026-11-04 10:58 UTC+6  
**Final Outcome:** **17 Passed, 0 Failed (100% Success)**

```
================================================================
📱 SHAKILWORK: REAL BACKEND & NATIVE ANDROID INTEGRATION TEST
================================================================

--- 1. Register Candidate on Web & Verify on Android (Same Database) ---
✅ PASS: Candidate registered in PostgreSQL database: ID=SGR-2026-000016
✅ PASS: Android Client receives valid JWT token from backend
✅ PASS: Android session matches Candidate DB ID (c924fd86-efa6-43a0-8b80-2d2753b69ca1)
✅ PASS: Android session matches Applicant Number (SGR-2026-000016)

--- 2. Upload Document on Android & Verify on Web ---
✅ PASS: Document recorded in PostgreSQL: passport_scan.jpg
✅ PASS: Web Admin/Staff sees the exact uploaded document in real time
✅ PASS: Document relation directly maps to candidate on Web

--- 3. Update Application / Processing Status on Android & Verify on Web ---
✅ PASS: Job Application created: 8aefdd82-fcf8-4d9f-a13c-a75b1eb13f72
✅ PASS: Status updated to SHORTLISTED via Android Staff action
✅ PASS: Web Dashboard immediately reflects SHORTLISTED status

--- 4. Record Payment on Android & Verify on Web ---
✅ PASS: Payment recorded: Receipt REC-896996, Amount: 20000 BDT
✅ PASS: Web Finance Ledger shows correct PARTIALLY_PAID status
✅ PASS: Web Finance Ledger reflects exact paid amount (20,000 BDT)
✅ PASS: Web Finance Ledger reflects exact remaining due (30,000 BDT)

--- 5. Candidate, Staff & Admin Isolation Verification ---
✅ PASS: Staff/Admin token successfully verified
✅ PASS: SECURITY GATE: Candidate token strictly rejected by Staff API verifier
✅ PASS: SECURITY GATE: Staff token strictly rejected by Candidate Portal verifier

--- Cleaning up temporary integration records ---
✓ Cleanup complete.

================================================================
FINAL INTEGRATION RESULTS: 17 PASSED, 0 FAILED
================================================================
```

---

## 3. Flutter Unit & Widget Test Suite Results

**Test Command:** `flutter test`  
**Output:** **54 Tests Passed, 0 Failed across 11 Test Suites**

| Test Suite File | Tests | Pass | Fail | Modules Tested |
| :--- | :--- | :--- | :--- | :--- |
| `test/core/api_client_test.dart` | 6 | 6 | 0 | GET/POST parsing, 401/403/404/429/500 exception handling |
| `test/core/config_test.dart` | 5 | 5 | 0 | Branding constants, loopback IP routing, HTTPS enforcement |
| `test/core/safe_logger_test.dart` | 2 | 2 | 0 | Redaction of passwords, tokens, NID numbers |
| `test/core/secure_storage_test.dart` | 5 | 5 | 0 | Keystore token storage, multi-account separation |
| `test/core/offline_draft_test.dart` | 2 | 2 | 0 | Offline application drafts and document queue |
| `test/features/auth_repository_test.dart` | 8 | 8 | 0 | Candidate login, staff login, admin login, session restoration |
| `test/features/candidate_registration_test.dart` | 3 | 3 | 0 | Candidate registration form validation, photo picker, error views |
| `test/features/candidate_portal_test.dart` | 8 | 8 | 0 | Candidate jobs, applications, document upload, finance summary |
| `test/features/staff_admin_portal_test.dart` | 9 | 9 | 0 | Applicant review, document approval/rejection, processing cases |
| `test/features/login_screens_test.dart` | 4 | 4 | 0 | Candidate, Staff, Admin login screen UI & password visibility toggle |
| `test/widget_test.dart` | 2 | 2 | 0 | App launch with `ShakilTravelsApp` and home showcase rendering |
| **Total** | **54** | **54** | **0** | **100% Passing** |

---

## 4. Key Findings & Data Parity Proof
1. **Single Source of Truth:** Candidate `SGR-2026-000016` registered via the API appeared simultaneously on both platforms with identical IDs.
2. **Instant Document Sync:** When an Android user uploads a document, the Web Staff review screen at `/admin/documents` accesses the exact same database row and file URL.
3. **Financial Accounting Consistency:** Payments recorded via the mobile accounting interface automatically recalculated the invoice balance from 50,000 BDT to 30,000 BDT with zero discrepancy.
