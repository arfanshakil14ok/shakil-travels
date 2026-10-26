# SHAKIL TRAVELS — Phase 00: Data & Workflow Audit
**Audit Date**: October 25, 2026  
**Auditor**: Senior Software Architect & Database Engineer  
**Component**: PostgreSQL, Prisma ORM, Data Migrations, Recruitment Lifecycle  

---

## 1. Database Schema & Data Models

The Prisma schema (`prisma/schema.prisma`) comprises 2,207 lines of code and defines over 50 interconnected relational models organized into 9 domain boundaries:

```text
1. Core RBAC          : User, Role, Permission, RolePermission
2. System & Audit     : SystemSetting, AuditLog, Notification
3. Customer CRM       : Customer (Polymorphic bridge between Applicant & Employer)
4. Candidate Core     : Applicant, ApplicantProfile, ApplicantNote, CandidateSkill, CandidateLanguage, CandidateEducation, CandidateExperience
5. Global Lookups     : Country, JobCategory, Service, DocumentType
6. Foreign Employers  : Employer, EmployerContact, EmployerDocument
7. Recruitment ATS    : Job, Application, ApplicationScreening, ApplicationStatusHistory, Document, Interview
8. Post-Selection ERP : RecruitmentProcessingCase, ProcessingStatusHistory, ProcessingDocumentRequirement,
                       MedicalCase, VisaCase, ClearanceCase, TravelTicket, DepartureCase, JoiningCase
9. Financial Accounts : Invoice, InvoiceItem, Payment, Receipt, Refund, FinancialAdjustment,
                       CandidateLedgerEntry, PaymentPlan, PaymentPlanInstallment, RecruitmentCost, FinancialTransaction
```

---

## 2. Recruitment Lifecycle Workflow Verification

The recruitment engine models an end-to-end foreign employment journey:

```text
[Public Job / Direct Visit]
             │
             ▼
     (Applicant Record) ──> [Customer CRM Created]
             │
             ▼
     (Application Placed) ──> CurrentStage: APPLIED
             │
             ▼
   [13-Point Screening] ──> PASS / FAIL
             │
             ▼
   [Shortlist & Interview] ──> AGENCY / EMPLOYER Interview (Scorecard 1-10)
             │
             ▼
     (Candidate Selected) ──> [RecruitmentProcessingCase Initialized]
             │
    ┌────────┴───────────────────────────┐
    │                                    │
    ▼                                    ▼
[Medical Examination]             [Advance Invoice Issued]
    │ (GAMCA Fit)                        │ (Payment & Receipt)
    ▼                                    ▼
[Visa Stamping Submission]        [Candidate Ledger Credit]
    │ (Embassy Approval)
    ▼
[BMET Clearance & Smart Card]
    │ (Government Emigration Clearance)
    ▼
[Flight Ticket & Travel Booking]
    │
    ▼
[Departure & Airport Assistance]
    │
    ▼
[Employer Joining & Final Settlement]
```

### Double-Entry Candidate Ledger
The `CandidateLedgerEntry` model implements strict accounting:
- **Debit**: Invoiced services (Visa processing fee, medical, airfare).
- **Credit**: Candidate cash/bank payments, approved refunds, waivers.
- **Integrity**: `calculateCandidateBalance()` computes running totals dynamically from reconciled transactions.

---

## 3. Migration History & Database Connections

### 3.1 Migration Baseline
- **Active Baseline**: `prisma/migrations/20260907000000_init/`
- **State**: The schema was initialized via a single baseline migration in September 2026. Subsequent schema refinements have been applied via `prisma db push` during active development phases.

### 3.2 Database Connections
- **Production / Staging**: Neon Serverless Postgres with PgBouncer connection pooling (`ep-morning-flower-...-pooler.c-6.us-east-2.aws.neon.tech`).
- **Local Isolated Development**: Embedded PostgreSQL runner (`scripts/db-runner.js`) running on `127.0.0.1:54329`.

---

## 4. Data Workflow Findings & Defects

### [DAT-001] Prisma Migration Drift & Single Migration Chain
- **Severity**: High
- **Impact**: While `schema.prisma` is valid and current, the `prisma/migrations/` directory contains only the initial migration `20260907000000_init`. Running `prisma migrate deploy` on a fresh production database risks failing to create newly introduced columns and relations (e.g., specialized post-selection cases and ledger structures) unless a new consolidated baseline migration is created.
- **File**: `prisma/migrations/`
- **Evidence**: Directory contains only 1 migration dated `20260907000000_init` despite extensive schema expansion across subsequent phases.
- **Recommended Fix**: Generate a clean, verified migration checkpoint before production deployment by running `prisma migrate dev --create-only` against a staging database instance.
- **Required Verification**: Run `npx prisma migrate status` against a staging database to verify zero drift.

---

### [DAT-002] Destructive Database Drop Clause in Local Development Script
- **Severity**: Medium
- **Impact**: In `scripts/db-runner.js` (lines 41-47), the local development runner executes `DROP DATABASE IF EXISTS shakil_global_recruitment` if the database encoding check does not return `UTF8`. If an environment misreports encoding or has temporary connection errors, this clause drops the entire local database.
- **File**: `scripts/db-runner.js`, Lines 41-47
- **Evidence**:
  ```javascript
  if (res.rows.length === 0 || res.rows[0].enc !== 'UTF8') {
    if (res.rows.length > 0) {
      console.log(`Recreating database "shakil_global_recruitment" with UTF8 encoding...`);
      await client.query(`DROP DATABASE IF EXISTS shakil_global_recruitment`);
    }
  }
  ```
- **Recommended Fix**: Remove the automated `DROP DATABASE` call. If encoding is incompatible, log an error message and instruct the developer to reinitialize manually.
- **Required Verification**: Simulate a non-UTF8 database check; verify that the script exits with a warning rather than executing a destructive drop.

---

### [DAT-003] Soft-Delete vs. Orphan Customer Entity Risk
- **Severity**: Low
- **Impact**: In `prisma/schema.prisma` (lines 203, 205), `Customer` references `Applicant` and `Employer` with `onDelete: SetNull`. If an applicant is deleted from the system, the corresponding `Customer` record remains with `applicantId = null`, leading to orphan billing ledgers.
- **File**: `prisma/schema.prisma`, Line 203
- **Evidence**:
  ```prisma
  applicantId String? @unique
  applicant   Applicant? @relation(fields: [applicantId], references: [id], onDelete: SetNull)
  ```
- **Recommended Fix**: Implement application-level soft deletion (`isActive: false` or `isDeleted: true`) across both `Applicant` and `Customer` rather than hard deletes.
- **Required Verification**: Verify that applicant deactivation in `/api/applicants/[id]` toggles `isActive: false` and preserves linked customer invoices.
