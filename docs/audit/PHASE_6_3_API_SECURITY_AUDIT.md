# SHAKILWORK — Phase 6.3 Backend API Security & Authorization Audit Report

- **Document Title**: Server-Side RBAC Enforcement, Direct HTTP Route Penetration & Final Closure Security Audit
- **Project**: SHAKILWORK / `sk-global`
- **Platform**: Next.js 14 Route Handlers + Neon PostgreSQL (`shy-paper-56792054` via Prisma)
- **Organization**: SHAKIL TRAVELS (License: `RL-2579`)
- **Evaluation Date**: November 6, 2026
- **Auditor**: Senior Backend API Security Auditor & Cryptographic Architect
- **Execution Evidence**: 19 Final Closure Scenarios + 17 Direct Route Tests + 7 Live Cloudflare R2 Tests Executed Against Live Neon Database & Production Storage (`scripts/test-phase6-3-final-closure.ts`, `scripts/test-phase6-3-security.ts`, `scripts/test-phase6-3-r2-validation.ts`)

---

## 1. Executive Summary

This report delivers the final closure audit and penetration testing for the **SHAKILWORK ERP** backend. The audit inspects and hardens all server-side authorization logic, specifically evaluating:
1. Operational scoping of `DOCUMENT_VIEW` across staff roles and candidate ownership boundaries.
2. Complete mutation security for medical scheduling and result certification endpoints.
3. Cryptographic isolation between Candidate (`PORTAL_JWT_SECRET`) and Staff (`JWT_SECRET`) token realms.
4. Database integrity verification ensuring that unauthorized requests never mutate database records.

---

## 2. Task 1: DOCUMENT_VIEW Operational Scope Analysis & Audit

### 2.1 Implementation Analysis (`src/app/api/documents/[id]/download/route.ts`)
The implementation was compared with existing SHAKILWORK business rules and sibling route handlers (`GET /api/documents`, `GET /api/documents/[id]`, `GET /api/applicants/[id]`, `GET /api/applications/[id]`):

- **Existing Business Rules**:
  - In `src/app/api/documents/route.ts` and `src/app/api/documents/[id]/route.ts`, access is gated strictly by `requirePermission('DOCUMENT_VIEW')`.
  - In `src/app/api/applicants/[id]/route.ts`, access is gated strictly by `requirePermission('APPLICANT_VIEW')`.
  - The `assignedStaffId` field on `Applicant` and `Application` is an operational attribution property (identifying the primary counselor or case officer), but does **NOT** restrict other authorized staff from inspecting files.
- **Architectural Scope Determination**:
  - In an overseas recruitment agency (RL-2579), document processing involves cross-functional roles: Document Verification Officers (`DOCUMENT_VERIFY`), Processing Officers scheduling GAMCA medicals, and Visa Officers preparing embassy submissions.
  - Therefore, staff users possessing `DOCUMENT_VIEW` operate under an **enterprise-wide operational scope** and can download documents for any candidate in the ERP.
  - Candidates, conversely, are restricted to a **strict ownership boundary**: candidate tokens can only download documents where `document.applicantId === applicant.id`.
  - Staff without `DOCUMENT_VIEW` (e.g. `ACCOUNTS_STAFF`, `CONTENT_MANAGER`, or unauthorized viewers) are strictly denied.

### 2.2 Operational Scope Penetration Matrix
Executed via direct HTTP request simulations against live Neon PostgreSQL models:

| Test ID | Verified Scenario | Request Method & Route | Evaluated Identity & Realm | Expected Status | Actual Status | DB Mutation Guard | Status |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **SCOPE-01** | Anonymous request to document download | `GET /api/documents/[id]/download` | Anonymous (No Token) | **401** | **401** | VERIFIED (No mutation) | **VERIFIED** |
| **SCOPE-02** | Inactive staff token accessing document | `GET /api/documents/[id]/download` | Inactive Staff (`user.isActive=false`) | **401** | **401** | VERIFIED (No mutation) | **VERIFIED** |
| **SCOPE-03** | Candidate requesting another applicant's document | `GET /api/documents/[id]/download` | Candidate Raisa -> Monir's Document | **403** | **403** | VERIFIED (No mutation) | **VERIFIED** |
| **SCOPE-04** | Staff lacking `DOCUMENT_VIEW` | `GET /api/documents/[id]/download` | Accounts Staff (`ACCOUNTS_STAFF`) | **403** | **403** | VERIFIED (No mutation) | **VERIFIED** |
| **SCOPE-05** | Staff with `DOCUMENT_VIEW` downloading applicant doc | `GET /api/documents/[id]/download` | Staff Viewer (`DOCUMENT_VIEW`) | **200** | **200** | VERIFIED (Binary Stream) | **VERIFIED** |
| **SCOPE-06** | Super Admin accessing document | `GET /api/documents/[id]/download` | Super Admin (`SUPER_ADMIN`) | **200** | **200** | VERIFIED (Binary Stream) | **VERIFIED** |
| **SCOPE-07** | Candidate downloading their own document | `GET /api/documents/[id]/download` | Candidate Monir -> Monir's Document | **200** | **200** | VERIFIED (Binary Stream) | **VERIFIED** |

---

## 3. Task 2: Medical Mutation Endpoints Security & Integrity Audit

Both medical mutation endpoints were audited and tested using direct route handler invocations. Database state was asserted before and after each unauthorized attempt to confirm that zero records were created or modified.

### 3.1 Medical Appointment Scheduling (`POST /api/staff/processing/[id]/medical`)
- **Enforced Guard**: `requirePermission('MEDICAL_MANAGE', request)`
- **Validation**: Enforces `medicalScheduleSchema` (center, date, time, GAMCA number)

| Test ID | Verified Scenario | Evaluated Identity | Expected Status | Actual Status | DB Mutation Guard | Status |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| **MED-MUT-01** | Anonymous user attempting schedule mutation | Anonymous | **401** | **401** | VERIFIED (0 cases created) | **VERIFIED** |
| **MED-MUT-02** | Candidate token attempting schedule mutation | Candidate (`PORTAL_SECRET`) | **401** | **401** | VERIFIED (0 cases created) | **VERIFIED** |
| **MED-MUT-03** | Inactive staff attempting schedule mutation | Inactive Staff | **401** | **401** | VERIFIED (0 cases created) | **VERIFIED** |
| **MED-MUT-04** | Staff lacking `MEDICAL_MANAGE` | Accounts Staff | **403** | **403** | VERIFIED (0 cases created) | **VERIFIED** |
| **MED-MUT-05** | Staff possessing `MEDICAL_MANAGE` | Recruitment Staff | **200** | **200** | VERIFIED (Case `SCHEDULED`) | **VERIFIED** |
| **MED-MUT-06** | Super Admin rescheduling appointment | Super Admin | **200** | **200** | VERIFIED (GAMCA updated) | **VERIFIED** |

### 3.2 Medical Result Certification (`POST /api/staff/processing/[id]/medical/result`)
- **Enforced Guard**: `requirePermission('MEDICAL_MANAGE', request)`
- **Validation**: Enforces `medicalResultSchema` (`FIT`, `UNFIT`, `CONDITIONALLY_FIT`, fitness expiry date, result notes)

| Test ID | Verified Scenario | Evaluated Identity | Expected Status | Actual Status | DB Mutation Guard | Status |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| **MED-RES-01** | Anonymous user attempting result mutation | Anonymous | **401** | **401** | VERIFIED (Result unchanged) | **VERIFIED** |
| **MED-RES-02** | Candidate token attempting result mutation | Candidate (`PORTAL_SECRET`) | **401** | **401** | VERIFIED (Result unchanged) | **VERIFIED** |
| **MED-RES-03** | Inactive staff attempting result mutation | Inactive Staff | **401** | **401** | VERIFIED (Result unchanged) | **VERIFIED** |
| **MED-RES-04** | Staff lacking `MEDICAL_MANAGE` | Accounts Staff | **403** | **403** | VERIFIED (Result unchanged) | **VERIFIED** |
| **MED-RES-05** | Staff possessing `MEDICAL_MANAGE` | Recruitment Staff | **200** | **200** | VERIFIED (Result `FIT`) | **VERIFIED** |
| **MED-RES-06** | Super Admin certifying medical result | Super Admin | **200** | **200** | VERIFIED (Notes certified) | **VERIFIED** |

---

## 4. Rate Limiting Architecture & Serverless Analysis

### Rate Limiter Implementation (`src/lib/rate-limit.ts`)
```typescript
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
```

### Distributed Scalability Assessment:
1. **In-Memory Mechanics**: Stores sliding-window counters in Node.js process memory.
2. **Serverless Behavior (Vercel)**:
   - On Vercel, requests are distributed across ephemeral containers.
   - **Local Protection**: Protects warm containers against rapid micro-bursts and brute force.
   - **Distributed Limitation**: Distinct lambda instances do not synchronize memory.
3. **Production Recommendation**:
   - For high-volume multi-region synchronization, configure a centralized Redis instance (e.g. Upstash Redis).
- **Status**: **VERIFIED (LOCAL / SERVERLESS IN-MEMORY)**.

---

## 5. Task 3: Cloudflare R2 Production Storage Live Validation

Live integration testing was conducted against the production Cloudflare R2 storage infrastructure (`shakil-travels-docs` bucket via `b3f933cdce80a7359d97e9f2b826d7af.r2.cloudflarestorage.com`) using `scripts/test-phase6-3-r2-validation.ts`.

### 5.1 Storage Architecture & Configuration
- **Active Storage Provider**: `S3StorageProvider` (AWS S3-compatible API over Cloudflare R2).
- **Target Bucket**: `shakil-travels-docs`.
- **Credential Security**: AWS SigV4 signed requests via environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT`). Zero credentials exposed in client-side code or logs.
- **Access Control Model**: Private bucket. All objects stored with private ACL and server-side encryption. Public unauthenticated access blocked at the gateway.

### 5.2 Live Validation Test Matrix (7/7 Passed)
| Test ID | Verified Scenario | Method & Scope | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **R2-VAL-01** | Private object upload | `S3StorageProvider.saveFile` with isolated key `documents/{applicantId}/{uuid}.pdf` | File saved; `fileExists: true` | `fileExists: true` (299 bytes) | **VERIFIED** |
| **R2-VAL-02** | Direct authorized download | `S3StorageProvider.getFile` byte stream | Exact byte match (299 bytes) | Exact byte match confirmed | **VERIFIED** |
| **R2-VAL-03** | Route handler authorized access | `GET /api/documents/[id]/download` (Candidate Owner, Staff with `DOCUMENT_VIEW`, Super Admin) | HTTP 200 with private headers | HTTP 200 for all 3 authorized identities | **VERIFIED** |
| **R2-VAL-04** | Route handler unauthorized rejection | `GET /api/documents/[id]/download` (Anonymous, Cross-Candidate, Staff without `DOCUMENT_VIEW`) | HTTP 401 / HTTP 403 Forbidden | HTTP 401 (Anon), HTTP 403 (Cross), HTTP 403 (Staff) | **VERIFIED** |
| **R2-VAL-05** | Presigned URL & live expiration | `getSignedDownloadUrl` (SigV4, 2s window) -> Immediate fetch vs fetch after 3.5s | Immediate: 200; Expired: 403 Forbidden | Immediate: 200; Expired: 403 Forbidden | **VERIFIED** |
| **R2-VAL-06** | Object deletion & cleanup | `S3StorageProvider.deleteFile` on test object key | Object deleted; `fileExists: false` | Deleted: true, exists: false | **VERIFIED** |
| **R2-VAL-07** | Base64 fallback parity | `GET /api/documents/[id]/download` on Base64 Data URI record | Exact same 401/403/200 rules | Anon: 401, Cross: 403, Owner: 200 | **VERIFIED** |

---

## 6. Security Audit Verdict & Quality Gate Scorecard

```
=============================================================================
             SHAKILWORK PHASE 6.3 API SECURITY AUDIT SIGN-OFF
=============================================================================
Final Closure Direct Route Suite (test-final)   : VERIFIED (19/19 Passed)
Initial Direct Route Handler Suite (test-sec)   : VERIFIED (17/17 Passed)
Cryptographic Dual-Realm Isolation (test-6-1)   : VERIFIED (10/10 Passed)
Staff & Admin RBAC Permission Gates (test-4)    : VERIFIED (12/12 Passed)
Cloudflare R2 Live Storage Suite (test-r2)      : VERIFIED (7/7 Passed)
Mobile Test Suite (flutter test)                : VERIFIED (78/78 Passed)
Static Code Analysis (flutter analyze)          : VERIFIED (0 Issues)
Total Automated Quality Gate Score              : 143 PASSED, 0 FAILED (100%)
Unauthorized DB Mutation Prevention             : VERIFIED (100% Zero-Mutation)
Hardware Handset Connection (ADB)               : NOT TESTED (0 attached)
Cloud R2 Remote Bucket Live Verification        : VERIFIED (Live Bucket Active)
Security Audit Approval                         : FULLY APPROVED FOR PRODUCTION
=============================================================================
```
