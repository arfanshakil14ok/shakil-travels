# SHAKILWORK — Phase 6.2 Screen Inventory
## Complete Mobile Catalog & Verification Matrix

**Project**: SHAKILWORK / `sk-global`  
**Platform**: Native Android (Flutter 3.47.8 / Dart 3.13.7)  
**Organization**: SHAKIL TRAVELS (RL-2579)  
**Production Web ERP**: [https://shakil-travels.vercel.app/](https://shakil-travels.vercel.app/)  
**Audit Date**: November 4, 2026  
**Document**: Phase 6.2 Screen Catalog & Implementation State  

---

## 1. Screen Architecture & Overview

The SHAKILWORK Android ERP application provides a unified client tailored for three primary user classes (**Candidates**, **Staff**, and **Administrators**), as well as a public exploration portal. All screens connect exclusively to the live Next.js API backed by Neon PostgreSQL.

---

## 2. Comprehensive Screen Inventory

### 2.1 Public & Authentication Flow

| Screen | File Path | Route | Purpose & Key Components | RBAC / Auth State | Verification |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Splash Screen** | `mobile/lib/features/splash/presentation/splash_screen.dart` | `/` | App launch branding, token validity check, secure storage restore, automatic role redirect. | Public / Auto | Verified (Unit + Widget) |
| **Unified Login** | `mobile/lib/features/auth/presentation/unified_login_screen.dart` | `/login` | Single login entrypoint for Candidate, Staff, and Admin. Corporate navy/pink branding, password toggle, biometric unlock, helpline bottom sheet. | Public | Verified (Unit + Widget + Live API) |
| **Candidate Registration** | `mobile/lib/features/auth/presentation/candidate_register_screen.dart` | `/candidate-register` | New candidate onboarding form: full name, mobile number, password, trade selection. | Public | Verified (Unit + Widget + Live API) |
| **Server Config Dialog** | `mobile/lib/features/auth/presentation/server_config_dialog.dart` | Modal | Diagnostic base URL switcher and API latency probe for network troubleshooting. | Public | Verified (Widget) |
| **Home Public Portal** | `mobile/lib/features/home/presentation/home_screen.dart` | `/home` | 4-tab public exploration: Featured overseas jobs, process roadmap, tracking card, and unified login tab. | Public | Verified (Unit + Widget) |

### 2.2 Candidate Self-Service Portal (`CandidateMainNavigationScreen`)

| Screen / Tab | File Path | Key UI Components | Data Source / API Endpoint | Verification |
| :--- | :--- | :--- | :--- | :---: |
| **Candidate Dashboard** (Tab 0) | `mobile/lib/features/candidate/presentation/screens/candidate_dashboard_screen.dart` | Bio card, profile completion progress, upcoming interview alert, 13-stage active application card, document verification summary, payment summary, quick action cards, available jobs preview, helpline card, notification bell. | `GET /api/portal/profile`<br>`GET /api/portal/applications`<br>`GET /api/portal/documents`<br>`GET /api/portal/finance`<br>`GET /api/jobs?limit=3`<br>`GET /api/portal/interviews` | Verified (Widget + Live Contract) |
| **Overseas Jobs** (Tab 1) | `mobile/lib/features/candidate/presentation/screens/candidate_jobs_screen.dart` | Search input, country filter chips, salary range, trade badges, empty state with filter reset, job card items. | `GET /api/jobs`<br>`GET /api/countries`<br>`GET /api/categories` | Verified (Widget + Live Contract) |
| **Job Details** | `mobile/lib/features/candidate/presentation/screens/job_details_screen.dart` | Country header, employer overview, salary & benefits, job requirements, one-tap apply button, WhatsApp inquiry. | `GET /api/jobs/:id`<br>`POST /api/portal/jobs/:id/apply` | Verified (Widget + Live Contract) |
| **My Applications** (Tab 2) | `mobile/lib/features/candidate/presentation/screens/candidate_applications_screen.dart` | Application status tabs (All, Active, Completed), tracking codes, milestone badge, empty state with CTA to circulars. | `GET /api/portal/applications` | Verified (Widget + Live Contract) |
| **Application Details** | `mobile/lib/features/candidate/presentation/screens/application_details_screen.dart` | Interactive 13-stage timeline tracker, stage blockers, document checklist, officer notes. | `GET /api/portal/applications/:id`<br>`GET /api/portal/processing/:id/timeline` | Verified (Widget + Live Contract) |
| **Document Hub** (Tab 3) | `mobile/lib/features/candidate/presentation/screens/candidate_documents_screen.dart` | Document compliance checklist, camera capture, file picker, upload progress indicator, offline draft queue, rejection notes. | `GET /api/portal/documents`<br>`POST /api/portal/documents` (Multipart) | Verified (Widget + Live Contract) |
| **Payments & Invoices** | `mobile/lib/features/candidate/presentation/screens/candidate_payments_screen.dart` | Total invoiced, paid, and outstanding balances, invoice cards with due dates, payment ledger and official receipt downloads. | `GET /api/portal/finance` | Verified (Widget + Live Contract) |
| **Candidate Profile** (Tab 4) | `mobile/lib/features/candidate/presentation/screens/candidate_profile_screen.dart` | Editable personal & professional info, address, passport details, save button, sign-out button routing to Unified Login. | `GET /api/portal/profile`<br>`PUT /api/portal/profile` | Verified (Widget + Live Contract) |

### 2.3 Staff Operational Workspace (`StaffMainNavigationScreen`)

| Screen / Tab | File Path | Key UI Components | Data Source / API Endpoint | Role & Permission Enforcement | Verification |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Staff Dashboard** (Tab 0) | `mobile/lib/features/staff/presentation/screens/staff_dashboard_screen.dart` | Staff header with role badge, operational metrics grid, RBAC-aware work queues, live audit stream, helpline card, notification bell. | `GET /api/dashboard/stats` | Respects `session.hasPermission`: queues are locked/disabled if permission is missing. | Verified (Widget + Live Contract) |
| **Recruitment Cases** (Tab 1) | `mobile/lib/features/staff/presentation/screens/staff_processing_cases_screen.dart` | Search and stage filter, 13-stage case list, assigned officer chips, stage badge, transition CTA. | `GET /api/staff/processing` | `CASE_VIEW` or `STAFF` role | Verified (Widget + Live Contract) |
| **Case Details** | `mobile/lib/features/staff/presentation/screens/staff_case_details_screen.dart` | Complete candidate case dossier, current stage progress, stage gate checklist, force override modal, audit timeline. | `GET /api/staff/processing/:id`<br>`POST /api/staff/processing/:id/transition` | `CASE_TRANSITION` or `STAFF` | Verified (Widget + Live Contract) |
| **Applicant Roster** (Tab 2) | `mobile/lib/features/staff/presentation/screens/staff_applicants_screen.dart` | Candidate roster, search by phone/name, filter by status, applicant count badge, details navigation. | `GET /api/applicants` | `APPLICANT_VIEW` or `STAFF` | Verified (Widget + Live Contract) |
| **Applicant Details** | `mobile/lib/features/staff/presentation/screens/staff_applicant_details_screen.dart` | Candidate bio, documents, internal notes log, add note dialog, contact shortcuts. | `GET /api/applicants/:id`<br>`POST /api/applicants/:id/notes` | `APPLICANT_VIEW` | Verified (Widget + Live Contract) |
| **Document Review** (Tab 3) | `mobile/lib/features/staff/presentation/screens/staff_document_review_screen.dart` | Document verification queue, document preview, approve / reject decision buttons, rejection reason input. | `GET /api/staff/processing?limit=50`<br>`POST /api/documents/:id/verify` | `DOCUMENT_VIEW`, `DOCUMENT_VERIFY` | Verified (Widget + Live Contract) |
| **Interview Schedule** | `mobile/lib/features/staff/presentation/screens/staff_interviews_screen.dart` | Upcoming interview list, candidate names, trade, venue, date, appointment status. | `GET /api/interviews` | `INTERVIEW_VIEW`, `RECRUITER` | Verified (Widget + Live Contract) |
| **QR Candidate Verification** | `mobile/lib/features/staff/presentation/screens/qr_verification_screen.dart` | Mobile camera QR code scanner, applicant ID parser, instant verification badge. | `GET /api/track?q=:id` | Staff & Admin only | Verified (Widget + Live Contract) |
| **Staff Profile & Security** (Tab 4) | `mobile/lib/features/staff/presentation/screens/staff_main_navigation_screen.dart` | Staff user details, role badge, permission list count, RL-2579 notice, sign-out dialog routing to Unified Login. | Client session | Staff session | Verified (Widget) |

### 2.4 Admin Executive Oversight (`AdminMainNavigationScreen`)

| Screen / Tab | File Path | Key UI Components | Data Source / API Endpoint | Role & Permission Enforcement | Verification |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Admin Dashboard** (Tab 0) | `mobile/lib/features/admin/presentation/screens/admin_dashboard_screen.dart` | Executive profile header, administrative command center shortcuts (Demands, Cases, QR Verify), staff workforce summary, business metrics, financial oversight card, security policy notice, live audit stream, notification bell. | `GET /api/dashboard/stats` | Financial card strictly gated behind `_canViewFinance` (`SUPER_ADMIN`, `INVOICE_VIEW`, `PAYMENT_VIEW`). | Verified (Widget + Live Contract) |
| **Job Demands Management** (Tab 1) | `mobile/lib/features/admin/presentation/screens/admin_job_demands_screen.dart` | Job demands list, open vacancies, published status, country filter, demand details. | `GET /api/jobs` | `JOB_VIEW`, `ADMIN` | Verified (Widget + Live Contract) |
| **Processing Oversight** (Tab 2) | `mobile/lib/features/staff/presentation/screens/staff_processing_cases_screen.dart` | High-level pipeline view of all 13 stages across the organization. | `GET /api/staff/processing` | `ADMIN` / `SUPER_ADMIN` | Verified (Widget + Live Contract) |
| **Audit Logs Stream** (Tab 3) | `mobile/lib/features/admin/presentation/screens/admin_audit_logs_screen.dart` | System-wide immutable audit trail, filter by action and entity, user timestamp, description. | `GET /api/audit-logs` | `AUDIT_LOG_VIEW`, `SUPER_ADMIN` | Verified (Widget + Live Contract) |
| **Admin Profile & Privileges** (Tab 4) | `mobile/lib/features/admin/presentation/screens/admin_main_navigation_screen.dart` | Executive privileges notice, super admin badge, sign-out confirmation dialog routing to Unified Login. | Client session | Admin session | Verified (Widget) |

---

## 3. Deprecated & Removed Files

During Phase 6.2 audit and refinement, the following orphaned and unreferenced placeholder files were safely removed:
1. `mobile/lib/features/admin/presentation/admin_dashboard_placeholder.dart` (Deleted)
2. `mobile/lib/features/candidate/presentation/candidate_dashboard_placeholder.dart` (Deleted)
3. `mobile/lib/features/profile/presentation/profile_placeholder_screen.dart` (Deleted)
4. `mobile/lib/features/staff/presentation/staff_dashboard_placeholder.dart` (Deleted)
