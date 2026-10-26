# SHAKIL TRAVELS — Phase 00: Implementation Roadmap
**Audit Date**: October 25, 2026  
**Auditor**: Senior Software Architect & Technical Lead  
**Scope**: Prioritized Remediation & Stabilization Plan (P0 through P3)  

---

## 1. Defect Severity Matrix

| Priority | Definition | Impact | Action Required |
| :--- | :--- | :--- | :--- |
| **P0 (Critical)** | Core workflow blocker, authentication vulnerability, or missing dependency baseline | Prevents compilation, CI execution, or exposes authentication | Immediate resolution in next phase |
| **P1 (High)** | Security gap, missing linter configuration, or deployment drift risk | Compromises production readiness or security isolation | Address before public release |
| **P2 (Medium)** | Architecture inconsistency, unprotected maintenance route, or developer tool bug | Non-fatal defect or technical friction | Schedule in stabilization sprint |
| **P3 (Low)** | Code cleanliness, redundant files, or minor technical debt | Minor optimization | Ongoing maintenance |

---

## 2. Prioritized Issues Breakdown

### Priority 0 (Critical Blockers)

#### [P0-1] Resolve Flutter Dependency Baseline (`MOB-001`)
- **Finding ID**: `MOB-001`
- **Component**: Mobile Client (`mobile/`)
- **Evidence**: `mobile/pubspec.lock` is missing; `dart analyze` reports unresolved `package:flutter` symbols.
- **Dependency**: None.
- **Action**: Execute `flutter pub get` with explicit network access to generate a committed `pubspec.lock` and `.dart_tool/package_config.json`, unblocking `flutter test` and mobile CI.

#### [P0-2] Production JWT Fallback Secret Guard (`SEC-001`)
- **Finding ID**: `SEC-001`
- **Component**: Security & Auth (`src/lib/auth.ts`, `src/lib/portal-auth.ts`, `src/middleware.ts`)
- **Evidence**: Hardcoded secret strings serve as fallbacks if environment variables are omitted.
- **Dependency**: None.
- **Action**: Add an assertion that aborts application bootstrap in production if `JWT_SECRET` or `PORTAL_JWT_SECRET` are undefined or equal to the default development strings.

---

### Priority 1 (High Priority)

#### [P1-1] Add ESLint Configuration Baseline (`WEB-001`)
- **Finding ID**: `WEB-001`
- **Component**: Web Linter (`package.json`)
- **Evidence**: `npm run lint` fails in non-interactive CI due to missing `.eslintrc.json`.
- **Dependency**: None.
- **Action**: Create `.eslintrc.json` extending `"next/core-web-vitals"`.

#### [P1-2] Enforce RBAC on Private Document Downloads (`SEC-003`)
- **Finding ID**: `SEC-003`
- **Component**: Sensitive Asset Protection (`src/app/api/documents/[id]/download/route.ts`)
- **Evidence**: Any authenticated staff member can download candidate passports and documents without verifying `DOCUMENT_VIEW` permission.
- **Dependency**: `hasPermission` utility in `src/lib/rbac.ts`.
- **Action**: Require `hasPermission(staffUser, 'DOCUMENT_VIEW')` before streaming sensitive files.

#### [P1-3] Reconcile Database Migration History (`DAT-001`)
- **Finding ID**: `DAT-001`
- **Component**: Database Migrations (`prisma/migrations/`)
- **Evidence**: Only the initial migration `20260907000000_init` exists despite extensive schema additions.
- **Dependency**: Access to staging database.
- **Action**: Generate a consolidated migration baseline (`prisma migrate diff` / `prisma migrate dev --create-only`) to ensure fresh production deployments match `schema.prisma`.

---

### Priority 2 (Medium Priority)

#### [P2-1] Add JWT Issuer and Audience Verification Claims (`SEC-002`)
- **Finding ID**: `SEC-002`
- **Component**: Authentication Tokens (`src/lib/auth.ts`, `src/lib/portal-auth.ts`)
- **Evidence**: Tokens lack explicit `iss` and `aud` claims.
- **Dependency**: None.
- **Action**: Update `SignJWT` and `jwtVerify` configurations with `iss: shakil-travels-erp` and `aud: shakil-travels-client`.

#### [P2-2] Secure System Seeding Endpoint (`WEB-003`)
- **Finding ID**: `WEB-003`
- **Component**: API Security (`src/app/api/system/seed/route.ts`)
- **Evidence**: Unauthenticated GET endpoint triggers database upserts.
- **Dependency**: `requireSuperAdmin` in `src/lib/rbac.ts`.
- **Action**: Protect route with `await requireSuperAdmin()` and disable in production.

#### [P2-3] Remove Destructive Database Drop in Local Runner (`DAT-002`)
- **Finding ID**: `DAT-002`
- **Component**: Developer Environment (`scripts/db-runner.js`)
- **Evidence**: Automated `DROP DATABASE` executed on non-UTF8 check.
- **Dependency**: None.
- **Action**: Replace `DROP DATABASE` with a non-destructive error exit.

#### [P2-4] Graceful Mobile Dashboard Argument Hydration (`MOB-003`)
- **Finding ID**: `MOB-003`
- **Component**: Mobile Routing (`mobile/lib/app/app_router.dart`)
- **Evidence**: Pushing dashboard routes without `SessionModel` defaults to login.
- **Dependency**: `SecureStorageService`.
- **Action**: Add session hydration from secure storage before redirecting.

---

### Priority 3 (Low Priority & Tech Debt)

#### [P3-1] Consolidate Redundant Public URL Aliases (`WEB-002`)
- **Finding ID**: `WEB-002`
- **Component**: Public Web (`src/app/(public)/`)
- **Action**: Merge duplicate routes (`/migrant-info`, `/visa-info`) into canonical paths.

#### [P3-2] Clean Redundant Mobile HTTP Dependency (`MOB-004`)
- **Finding ID**: `MOB-004`
- **Component**: Mobile Dependencies (`mobile/pubspec.yaml`)
- **Action**: Remove unused `package:http`.

---

## 3. Recommended Phased Execution Plan

```text
Phase 00: Full Project Discovery & Baseline Audit [ COMPLETED ]
   │
   ▼
Phase 01: Environment & Dependency Baseline Resolution
   - Execute controlled `flutter pub get` to establish `pubspec.lock`
   - Create `.eslintrc.json` to enable automated web linting
   - Add production startup guard for JWT secrets (SEC-001)
   │
   ▼
Phase 02: Security & Authorization Hardening
   - Implement `DOCUMENT_VIEW` RBAC check on document download (SEC-003)
   - Add `iss` / `aud` claims to candidate and staff JWT tokens (SEC-002)
   - Restrict `/api/system/seed` with `requireSuperAdmin` (WEB-003)
   │
   ▼
Phase 03: Mobile App Verification & Test Runner Execution
   - Verify `flutter analyze` passes cleanly
   - Run complete mobile test suite (`mobile/test/`)
   - Implement graceful session hydration in `AppRouter` (MOB-003)
   │
   ▼
Phase 04: Production Migration Checkpoint & Database Verification
   - Reconcile Prisma migration history (DAT-001)
   - Remove destructive drop in `scripts/db-runner.js` (DAT-002)
```

---

## 4. Next Phase Recommendation

**Execute Phase 01: Environment & Dependency Baseline Resolution first.**  
Resolving the Flutter dependency lockfile (`MOB-001`), adding `.eslintrc.json` (`WEB-001`), and securing the JWT environment guard (`SEC-001`) will unlock 100% automated test coverage across both the web and mobile stacks without touching active business logic.
