# SHAKILWORK — Phase 6.2 UI/UX Audit Report
## Enterprise Mobile Architecture & Design System Evaluation

**Document Title**: Phase 6.2 UI/UX Comprehensive Audit & Refinement Blueprint  
**Project**: SHAKILWORK / `sk-global`  
**Platform**: Native Android (Flutter 3.47.8 / Dart 3.13.7)  
**Organization**: SHAKIL TRAVELS (RL-2579)  
**Production Web ERP**: [https://shakil-travels.vercel.app/](https://shakil-travels.vercel.app/)  
**Audit Date**: November 4, 2026  
**Auditor**: Principal Enterprise Mobile Architect  
**Status**: AUDIT COMPLETE — PROCEEDING WITH PHASE 6.2 REFINEMENT  

---

## 1. Executive Summary

This audit assesses the visual architecture, component reusability, state handling, navigation flows, and dashboard completeness of the **SHAKILWORK** native Flutter Android module (`/mobile`).

In Phase 6.1, authentication was unified under `UnifiedLoginScreen` with automatic role-based navigation for Candidates, Staff, and Administrators. In Phase 6.2, we evaluate the UI implementation against enterprise design standards, identifying styling inconsistencies, missing dashboard information, orphaned placeholder files, and session logout routing gaps.

---

## 2. Directory & Screen Inventory

### 2.1 File Tree Analysis (`mobile/lib`)

```
mobile/lib/
├── app/
│   ├── app.dart                        # Root MaterialApp, locale and theme configuration
│   ├── app_router.dart                 # Route generator with RBAC guards
│   └── theme/
│       ├── app_colors.dart             # Primary color definitions
│       ├── app_theme.dart              # ThemeData definition
│       └── app_typography.dart         # Text style hierarchy
├── core/
│   ├── config/ (app_config.dart, environment.dart)
│   ├── errors/ (api_exception.dart, failure.dart)
│   ├── localization/ (app_localizations.dart, locale_provider.dart)
│   ├── network/ (api_client.dart, api_endpoints.dart, api_interceptor.dart, safe_logger.dart)
│   ├── notifications/ (notification_service.dart, notifications_sheet.dart)
│   ├── offline/ (offline_draft_service.dart)
│   ├── security/ (biometric_auth_service.dart, secure_storage.dart)
│   └── utils/ (support_launcher.dart)
├── features/
│   ├── admin/
│   │   └── presentation/
│   │       ├── admin_dashboard_placeholder.dart      [ORPHANED / UNUSED]
│   │       └── screens/
│   │           ├── admin_audit_logs_screen.dart       # Live audit stream
│   │           ├── admin_dashboard_screen.dart        # Executive dashboard
│   │           ├── admin_job_demands_screen.dart      # Job circular management
│   │           └── admin_main_navigation_screen.dart  # 4-tab bottom navigation
│   ├── auth/
│   │   ├── data/ (auth_repository.dart, session_model.dart)
│   │   └── presentation/
│   │       ├── candidate_register_screen.dart         # New candidate onboarding
│   │       ├── server_config_dialog.dart              # Base URL configuration
│   │       ├── unified_login_screen.dart              # Single entrypoint login
│   │       ├── role_selection_screen.dart             # Backward compatibility redirect
│   │       ├── candidate_login_screen.dart            # Backward compatibility redirect
│   │       └── staff_login_screen.dart                # Backward compatibility redirect
│   ├── candidate/
│   │   ├── data/ (candidate_models.dart, candidate_repository.dart)
│   │   └── presentation/
│   │       ├── candidate_dashboard_placeholder.dart  [ORPHANED / UNUSED]
│   │       └── screens/
│   │           ├── application_details_screen.dart    # 13-stage milestone tracker
│   │           ├── candidate_applications_screen.dart # Applications list
│   │           ├── candidate_dashboard_screen.dart    # Candidate home
│   │           ├── candidate_documents_screen.dart    # Document upload & verification
│   │           ├── candidate_jobs_screen.dart         # Overseas jobs catalog
│   │           ├── candidate_main_navigation_screen.dart # 5-tab bottom navigation
│   │           ├── candidate_payments_screen.dart     # Invoices & payment ledger
│   │           ├── candidate_profile_screen.dart      # Profile management
│   │           └── job_details_screen.dart            # Circular details
│   ├── home/
│   │   └── presentation/
│   │       ├── home_screen.dart                       # 4-tab public portal
│   │       └── widgets/ (destinations, featured jobs, hero, roadmap, tracking, trust)
│   ├── profile/
│   │   └── presentation/
│   │       └── profile_placeholder_screen.dart        [ORPHANED / UNUSED]
│   ├── splash/
│   │   └── presentation/
│   │       └── splash_screen.dart                     # Session check & routing
│   └── staff/
│       ├── data/ (staff_models.dart, staff_repository.dart)
│       └── presentation/
│           ├── staff_dashboard_placeholder.dart       [ORPHANED / UNUSED]
│           └── screens/
│               ├── qr_verification_screen.dart        # QR camera verification
│               ├── staff_applicants_screen.dart       # Applicant roster
│               ├── staff_applicant_details_screen.dart# Candidate dossier & notes
│               ├── staff_case_details_screen.dart     # 13-stage case processing
│               ├── staff_dashboard_screen.dart        # Operational workspace
│               ├── staff_document_review_screen.dart  # Document audit queue
│               ├── staff_interviews_screen.dart       # Interview scheduling
│               ├── staff_main_navigation_screen.dart  # 5-tab bottom navigation
│               └── staff_processing_cases_screen.dart # Processing queue
└── shared/
    └── widgets/
        ├── app_button.dart                            # Primary, secondary, outline buttons
        ├── app_card.dart                              # Container card with border
        ├── app_logo.dart                              # Vector and bitmap logo rendering
        ├── app_text_field.dart                        # Standardized text field
        ├── error_view.dart                            # Error screen with retry
        ├── loading_indicator.dart                     # Circular progress indicator
        └── status_badge.dart                          # Semantic status badges
```

---

## 3. Detailed Audit Findings

### 3.1 Design System Gaps

1. **Brand Colors**:
   - `AppColors.corporateNavy` is `#102B50` (Matches corporate palette).
   - `AppColors.surfaceWhite` is `#FFFFFF` (Matches corporate palette).
   - `AppColors.corporatePink` is `#E8A2C1` (Matches corporate accent).
   - *Missing*: Standard spacing scale (`AppSpacing`) providing consistent margin, padding, border radius, and icon size constants across screens.

2. **Shared Component Completeness**:
   - `AppCard`, `AppButton`, `AppTextField`, `StatusBadge`, `ErrorView`, `LoadingIndicator` exist and follow the corporate theme.
   - *Missing*: `AppAppBar` with unified branding, title typography, elevation rules, back button handling, and action styling.
   - *Missing*: `AppEmptyState` providing consistent illustration, title, message, and call-to-action when lists or search results are empty.
   - *Missing*: `AppBottomNavigation` providing consistent styling, elevation, height, and active/inactive icon states across `CandidateMainNavigationScreen`, `StaffMainNavigationScreen`, and `AdminMainNavigationScreen`.

### 3.2 Candidate Dashboard Audit (`candidate_dashboard_screen.dart`)

| Required Section | Current Status | Finding / Action Required |
| :--- | :---: | :--- |
| **Profile Summary** | Present | Shows name, applicant number, trade, and verified badge. |
| **Profile Completion** | Present | Displays progress bar and missing field hints. |
| **Active Application** | Present | Displays primary application with 13-stage milestone button. |
| **Document Verification Summary** | **Missing from Dashboard** | Currently only accessible inside the Documents tab. Needs a summary card showing verified, under-review, and required document counts directly on the dashboard. |
| **Available Jobs Preview** | **Missing from Dashboard** | Only reachable via navigation jump. Needs a live horizontal/vertical preview of top open overseas positions. |
| **Interview Information** | **Incomplete** | Does not display candidate's scheduled interview dates or status card on the dashboard. |
| **Payment & Invoice Summary** | **Missing from Dashboard** | Currently only inside the Payments tab. Candidate needs a high-level summary card (Total Invoiced, Total Paid, Outstanding Balance) with a shortcut to receipts. |
| **Notifications Shortcut** | **Missing** | No top bar notification bell or drawer action on the candidate dashboard. |

### 3.3 Staff Dashboard Audit (`staff_dashboard_screen.dart`)

| Required Section | Current Status | Finding / Action Required |
| :--- | :---: | :--- |
| **Staff Header & Identity** | Present | Displays staff name, role badge, email, and RL-2579 badge. |
| **Operational Metrics** | Present | Displays active applicants, open files, visa processing, and placements. |
| **Work Queues** | Present | Document verification, medical fitness, visa queue, interview schedule. |
| **Live Audit Feed** | Present | Displays recent system activity stream. |
| **RBAC Enforcement** | Partial | Needs explicit permission gating on operational buttons so staff without specific permissions do not see actionable triggers for unauthorized tasks. |
| **Notifications** | Partial | Needs notification bell action in app bar connecting to `NotificationsSheet`. |

### 3.4 Admin Dashboard Audit (`admin_dashboard_screen.dart`)

| Required Section | Current Status | Finding / Action Required |
| :--- | :---: | :--- |
| **Executive Header** | Present | Displays executive admin profile, role, RL-2579 credentials. |
| **Staff Workforce** | Present | Shows total, active, and inactive staff counts. |
| **Business Overview** | Present | Metrics for applicants, published jobs, visa cases, and placements. |
| **Financial Oversight** | Present | Strictly gated behind `_canViewFinance` (`SUPER_ADMIN`, `INVOICE_VIEW`, `PAYMENT_VIEW`). |
| **Security Policy** | Present | Notes mobile policy restrictions (no bulk delete, no DB reset). |
| **Audit Stream** | Present | Shows recent system activity with quick navigation to full logs. |
| **Notifications** | Partial | Needs top bar notification bell shortcut. |

### 3.5 Navigation & Session Management Audit

1. **Logout Routing Regression Identified**:
   - In `CandidateProfileScreen` (line 264), `_handleSignOut` navigated to `RoleSelectionScreen()`:
     ```dart
     Navigator.pushAndRemoveUntil(
       context,
       MaterialPageRoute(builder: (_) => const RoleSelectionScreen()),
       (route) => false,
     );
     ```
   - In `StaffMainNavigationScreen` (line 179), `_handleLogout` navigated to `RoleSelectionScreen()`.
   - In `AdminMainNavigationScreen` (line 179), `_handleLogout` navigated to `RoleSelectionScreen()`.
   - **Resolution**: Update all three logout handlers to navigate to `AppRouter.login` / `UnifiedLoginScreen` via `Navigator.pushNamedAndRemoveUntil(context, AppRouter.login, (route) => false)`.

2. **Orphaned / Unused Files**:
   - Four placeholder files remain in the codebase:
     * `mobile/lib/features/admin/presentation/admin_dashboard_placeholder.dart`
     * `mobile/lib/features/candidate/presentation/candidate_dashboard_placeholder.dart`
     * `mobile/lib/features/profile/presentation/profile_placeholder_screen.dart`
     * `mobile/lib/features/staff/presentation/staff_dashboard_placeholder.dart`
   - Verified that zero code references these files. They can be safely deprecated or removed.

---

## 4. Phase 6.2 Action Plan

1. **Create `AppSpacing`** (`mobile/lib/app/theme/app_spacing.dart`).
2. **Create `AppAppBar`** (`mobile/lib/shared/widgets/app_app_bar.dart`).
3. **Create `AppEmptyState`** (`mobile/lib/shared/widgets/app_empty_state.dart`).
4. **Create `AppBottomNavigation`** (`mobile/lib/shared/widgets/app_bottom_navigation.dart`).
5. **Export & standardize Design System components** (`AppButtons`, `AppTextFields`, `AppCards`, `AppLoading`, `AppErrorState`, `AppStatusBadge`).
6. **Enrich `CandidateDashboardScreen`**:
   - Add Document Verification Status Card.
   - Add Payment & Billing Summary Card.
   - Add Top Available Overseas Jobs Carousel/List.
   - Add Interview / Deployment Schedule Alert Card.
   - Add Notification Bell to top app bar.
7. **Refine `StaffDashboardScreen`**:
   - Add Notification Bell to app bar.
   - Enforce RBAC permission checks on work queue navigation.
8. **Refine `AdminDashboardScreen`**:
   - Add Notification Bell to app bar.
   - Standardize app bar with `AppAppBar`.
9. **Fix Logout Navigation**:
   - Update `CandidateProfileScreen`, `StaffMainNavigationScreen`, and `AdminMainNavigationScreen` to route directly to `UnifiedLoginScreen`.
10. **Clean Up Unused Placeholders**.
11. **Comprehensive UI Testing**:
    - Add unit/widget tests for all new design system widgets.
    - Add tests for Candidate, Staff, and Admin dashboard enhancements.
    - Verify `flutter analyze` passes with 0 issues.
    - Verify `flutter test` passes 100%.
12. **Compile Release APK** and generate deliverables.
