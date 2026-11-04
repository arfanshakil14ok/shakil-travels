# SHAKILWORK — API Integration Matrix (Web ERP ↔ Native Android)

This matrix catalogs every backend endpoint utilized by the SHAKILWORK native Android Flutter application, verifying 100% parity with the existing Next.js 14 API routes and PostgreSQL database.

---

## 1. Authentication & Session Endpoints

| Category | HTTP Method | Endpoint URL | Next.js Handler | Mobile Repository & Caller | Auth Header / Cookie | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Candidate Login** | `POST` | `/api/portal/auth/login` | `src/app/api/portal/auth/login/route.ts` | `AuthRepository.loginCandidate()` | Public | Verified |
| **Candidate Register** | `POST` | `/api/portal/auth/register` | `src/app/api/portal/auth/register/route.ts` | `AuthRepository.registerCandidate()` | Public | Verified |
| **Candidate Session** | `GET` | `/api/portal/auth/me` | `src/app/api/portal/auth/me/route.ts` | `AuthRepository.restoreSession()` | `Bearer <portal_token>` | Verified |
| **Candidate Logout** | `POST` | `/api/portal/auth/logout` | `src/app/api/portal/auth/logout/route.ts` | `AuthRepository.logout()` | `Bearer <portal_token>` | Verified |
| **Staff/Admin Login** | `POST` | `/api/auth/login` | `src/app/api/auth/login/route.ts` | `AuthRepository.loginStaff()` / `loginAdmin()` | Public | Verified |
| **Staff Session** | `GET` | `/api/auth/me` | `src/app/api/auth/me/route.ts` | `AuthRepository.restoreSession()` | `Bearer <staff_token>` | Verified |
| **Staff Logout** | `POST` | `/api/auth/logout` | `src/app/api/auth/logout/route.ts` | `AuthRepository.logout()` | `Bearer <staff_token>` | Verified |

---

## 2. Public Showcase & Verification Endpoints

| Category | HTTP Method | Endpoint URL | Next.js Handler | Mobile Repository & Caller | Description | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **System Health** | `GET` | `/api/health` | `src/app/api/health/route.ts` | `ServerConfigDialog._testConnection()` | Verifies DB connection & server responsiveness | Verified |
| **Jobs Catalog** | `GET` | `/api/jobs` | `src/app/api/jobs/route.ts` | `CandidateRepository.getJobs()` | Dynamic overseas job demands with salary & country | Verified |
| **Job Details** | `GET` | `/api/jobs/[slug]` | `src/app/api/jobs/[slug]/route.ts` | `CandidateRepository.getJobDetails()` | Full requirements, benefits, and apply action | Verified |
| **Countries** | `GET` | `/api/countries` | `src/app/api/countries/route.ts` | `HomeScreen` & `CandidateJobsScreen` | Destination filter chips (Saudi Arabia, UAE, etc.) | Verified |
| **Categories** | `GET` | `/api/categories` | `src/app/api/categories/route.ts` | `CandidateJobsScreen` | Industry trade filters (Construction, Hospitality) | Verified |
| **Live Tracking & QR** | `GET` | `/api/track?q=` | `src/app/api/track/route.ts` | `QrVerificationScreen` & `HomeTrackingView` | Real-time candidate visa stage verification | Verified |

---

## 3. Candidate Self-Service Portal Endpoints

| Category | HTTP Method | Endpoint URL | Next.js Handler | Mobile Repository & Caller | Description | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Candidate Profile** | `GET` | `/api/portal/profile` | `src/app/api/portal/profile/route.ts` | `CandidateRepository.getProfile()` | Bio data, skills, address, passport info | Verified |
| **Update Profile** | `PUT` | `/api/portal/profile` | `src/app/api/portal/profile/route.ts` | `CandidateRepository.updateProfile()` | Edits contact, address, passport numbers | Verified |
| **My Applications** | `GET` | `/api/portal/applications` | `src/app/api/portal/applications/route.ts` | `CandidateRepository.getApplications()` | Live application lifecycle tracking | Verified |
| **Apply for Job** | `POST` | `/api/portal/applications` | `src/app/api/portal/applications/route.ts` | `CandidateRepository.applyForJob()` | Submits new job application to DB | Verified |
| **Candidate Documents** | `GET` | `/api/portal/documents` | `src/app/api/portal/documents/route.ts` | `CandidateRepository.getDocuments()` | Lists submitted documents & document types | Verified |
| **Upload Document** | `POST` | `/api/portal/documents` | `src/app/api/portal/documents/route.ts` | `CandidateRepository.uploadDocument()` | Native camera/gallery/file upload with R2 sync | Verified |
| **Finance & Invoices** | `GET` | `/api/portal/finance` | `src/app/api/portal/finance/route.ts` | `CandidateRepository.getFinanceSummary()` | Invoices, receipts, paid amount, due balance | Verified |
| **Interviews** | `GET` | `/api/portal/interviews` | `src/app/api/portal/interviews/route.ts` | `CandidateRepository.getInterviews()` | Scheduled employer interview dates & venues | Verified |
| **Notifications** | `GET` | `/api/portal/notifications`| `src/app/api/portal/notifications/route.ts` | `NotificationService.getNotifications()` | Status alerts, interview reminders, receipts | Verified |

---

## 4. Staff & Administrative Operations Endpoints

| Category | HTTP Method | Endpoint URL | Next.js Handler | Mobile Repository & Caller | Description | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Staff Dashboard** | `GET` | `/api/dashboard/stats` | `src/app/api/dashboard/stats/route.ts` | `StaffRepository.getDashboardStats()` | High-level metrics: total candidates, visas | Verified |
| **Applicants List** | `GET` | `/api/applicants` | `src/app/api/applicants/route.ts` | `StaffRepository.getApplicants()` | Paginated applicant search & filter | Verified |
| **Applicant Details** | `GET` | `/api/applicants/[id]` | `src/app/api/applicants/[id]/route.ts` | `StaffRepository.getApplicantDetails()` | Complete candidate dossier & audit trail | Verified |
| **Document Review** | `POST` | `/api/documents/[id]/verify` | `src/app/api/documents/[id]/verify/route.ts` | `StaffRepository.verifyDocument()` | Approve or Reject document with reasons | Verified |
| **Processing Cases** | `GET` | `/api/staff/processing` | `src/app/api/staff/processing/route.ts` | `StaffRepository.getProcessingCases()` | Stage progression (Medical, Visa, BMET) | Verified |
| **Case Transition** | `POST` | `/api/staff/processing/[id]/transition` | `.../transition/route.ts` | `StaffRepository.transitionCase()` | Transitions visa processing pipeline stage | Verified |
| **Interviews Schedule**| `GET` | `/api/interviews` | `src/app/api/interviews/route.ts` | `StaffRepository.getInterviews()` | Manages client interview slots | Verified |
| **Audit Logs** | `GET` | `/api/audit-logs` | `src/app/api/audit-logs/route.ts` | `StaffRepository.getAuditLogs()` | Immutable admin security & action audit logs | Verified |
