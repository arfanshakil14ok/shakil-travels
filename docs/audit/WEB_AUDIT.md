# SHAKIL TRAVELS — Phase 00: Web & Backend API Audit
**Audit Date**: October 25, 2026  
**Auditor**: Senior Software Architect & Next.js Engineer  
**Component**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, API Handlers  

---

## 1. Page Hierarchy & Routing Map

The web application utilizes the Next.js 14 App Router partitioned into four primary route spaces:

### 1.1 Public Zone `(public)`
- `/`: Public Homepage with radiant mesh hero, services overview, destination countries, trust indicators, scam awareness strip, and contact CTA.
- `/jobs` & `/jobs/[slug]`: Public job catalog and vacancy detail views with one-click application initiation modal.
- `/countries` & `/countries/[slug]`: Destination country labor guides, minimum wage information, and visa guidelines.
- `/track`: Real-time application tracking by Application Code (`SGR-APP-...`) or Passport Number.
- `/verify`: Public credential and application slip verification interface.
- `/invoice/verify/[invoiceNumber]`: Public financial document integrity verification.
- `/scam-awareness`, `/migrant-info`, `/skill-training`, `/training-centers`: Informational and compliance pages.
- `/login`, `/register`, `/forgot-password`, `/reset-password`: Candidate authentication entrypoints.

### 1.2 Candidate Portal `/portal` (and legacy alias `/candidate`)
- `/portal`: Candidate dashboard showing profile completion percentage, application status summary, and recent alerts.
- `/portal/jobs` & `/portal/jobs/[id]`: Member job explorer with pre-filled wizard draft functionality.
- `/portal/applications` & `/portal/applications/[id]`: Detailed application tracking, document status, and printable **Application Slip (A5 format)**.
- `/portal/documents`: Candidate document repository (passport, photo, medical certificate, police clearance).
- `/portal/finance`: Personal financial ledger, invoices, payment plans, and receipts.
- `/portal/processing/[id]`: Post-selection processing milestones (Medical, Visa Stamping, BMET Clearance, Flight Booking, Departure).
- `/portal/profile`: Comprehensive candidate profile editor and photo management.

### 1.3 Executive Administration `/admin`
- `/admin/dashboard`: Executive KPI dashboard (applications, revenue, visa pass rate, departed workers).
- `/admin/applicants` & `/admin/applications`: Centralized applicant tracking system (ATS) with status pipeline.
- `/admin/jobs` & `/admin/employers`: Demand order management and foreign employer directory.
- `/admin/finance`: Corporate ledger, invoice generation, payment approval, and aging reports.
- `/admin/users`, `/admin/roles`, `/admin/audit-logs`: User governance, role permissions, and immutable audit logs.
- `/admin/calendar`, `/admin/tasks`: Operational scheduling and task delegation.
- `/admin/trash`: Soft-delete recovery mechanism.

### 1.4 Operations Staff `/staff`
- `/staff/dashboard`: Officer workload queue.
- `/staff/applications` & `/staff/applicants`: Screening, shortlisting, and candidate interviews.
- `/staff/processing`: Case-by-case processing lifecycle management.
- `/staff/medical`, `/staff/clearance`, `/staff/departure`: Milestone verification and flight logistics.
- `/staff/invoices`, `/staff/receipts`: On-the-ground billing and payment collection.

---

## 2. API Route Architecture (212 Endpoints)

The API is structured under `src/app/api/` with strict RESTful conventions.

### 2.1 Route Distribution
- **Authentication & Sessions**: `/api/auth/*` (Staff/Admin) and `/api/portal/auth/*` (Candidate).
- **Recruitment Core**: `/api/applicants/*`, `/api/applications/*`, `/api/jobs/*`, `/api/employers/*`.
- **Processing Operations**: `/api/staff/processing/*`, `/api/post-selection/*`.
- **Financial Accounting**: `/api/invoices/*`, `/api/payments/*`, `/api/accounts/*`, `/api/staff/receipts/*`, `/api/staff/refunds/*`.
- **Media & Document Assets**: `/api/portal/photo/[id]`, `/api/documents/[id]/download`, `/api/portal/profile/upload-photo`.
- **Compliance & Public Verification**: `/api/track`, `/api/certificates/verify/*`, `/api/invoices/verify/*`.

### 2.2 Data Access Patterns
- **Prisma Client**: Unified single instance loaded via `@/lib/prisma`.
- **Transactions**: Multi-step workflows (e.g. `publicJobApplicationSchema` execution in `src/app/api/applications/initiate/route.ts`) use `prisma.$transaction` to guarantee atomicity between `Applicant`, `Customer`, `Application`, and `ApplicationStatusHistory`.
- **Dual Bearer / Cookie Access**: Recent updates in `src/lib/auth.ts` and `src/lib/portal-auth.ts` enable API endpoints to accept both mobile `Authorization: Bearer <token>` and web HTTP-only cookies.

---

## 3. Printable Application Slip & Photo Verification

### 3.1 Layout & Printing Engine
- **Component**: `src/components/portal/application-slip-view.tsx`
- **Output Formats**: A5 print card and standard A4 portrait sheet.
- **Isolation Mechanism**: Creates a hidden isolated iframe to render CSS `@page { size: A4 portrait; margin: 8mm 10mm; }` with strictly scoped styles, eliminating DOM bleed and toolbar artifacts.
- **QR Code Verification**: Generates a high-contrast QR code via `generateQrDataUrl` encoding the verification URL (`/track?q=SGR-APP-...`).

### 3.2 Candidate Photo Persistence & Self-Healing
- **Endpoint**: `src/app/api/portal/photo/[id]/route.ts`
- **Resolution Strategy**:
  1. Base64 data URL decoded directly from `Applicant.profilePhoto`.
  2. External CDN URL redirect if stored remotely.
  3. Cloudflare R2 / S3 object retrieval via canonical keys (`photos/applicant_[id].jpg`).
  4. Local disk scan in `public/uploads/photos/`.
  5. **Self-Healing Fallback**: Inspects the `Document` and `ApplicantProfile` tables for embedded Base64 image backups, restores them to disk/R2, and serves the recovered image.

---

## 4. Web Findings & Defects

### [WEB-001] Missing ESLint Configuration File
- **Severity**: Medium
- **Impact**: Running `npm run lint` or `npx next lint` fails in non-interactive CI/CD pipelines because Next.js stops to prompt for configuration (`? How would you like to configure ESLint?`).
- **File**: Root repository (`.eslintrc.json` missing)
- **Evidence**: Executing `npx.cmd next lint` outputs interactive prompt and terminates with exit code 1.
- **Recommended Fix**: Add a standard `.eslintrc.json` extending `"next/core-web-vitals"`.
- **Required Verification**: Run `npx next lint` non-interactively; verify exit code 0.

---

### [WEB-002] Redundant Public Route Aliases
- **Severity**: Low
- **Impact**: Maintenance overhead and split SEO canonicals between `/migrant-info` vs `/migrant-information`, and `/visa-info` vs `/visa-information`.
- **File**: `src/app/(public)/migrant-info/` and `src/app/(public)/migrant-information/`
- **Evidence**: Both directories exist with separate page implementations.
- **Recommended Fix**: Consolidate into canonical URLs and add 301 redirects in `next.config.js`.
- **Required Verification**: Test that navigating to alias routes redirects with HTTP 301.

---

### [WEB-003] Unprotected System Seed Endpoint
- **Severity**: Medium
- **Impact**: `src/app/api/system/seed/route.ts` is accessible via public GET requests without authentication. While it only executes upserts for missing countries/jobs, it exposes internal database counts and allows unauthenticated execution of database write operations.
- **File**: `src/app/api/system/seed/route.ts`, Line 7
- **Evidence**: Route handler defines `export async function GET(request: NextRequest)` with no `requireAuth()` or `requireSuperAdmin()` guard.
- **Recommended Fix**: Add `await requireSuperAdmin()` or wrap execution in an environment check (`if (process.env.NODE_ENV === 'production') return 404`).
- **Required Verification**: Send GET request without admin token; verify response 401/403.

---

### [WEB-004] Route Parameter Typing Inconsistency
- **Severity**: Low
- **Impact**: Some App Router routes define `params` as `{ params: Promise<{ id: string }> }` while others use `{ params: { id: string } | Promise<{ id: string }> }` or unawaited params, creating potential migration friction for future Next.js major upgrades.
- **File**: `src/app/api/portal/photo/[id]/route.ts` (Line 12) vs `src/app/api/documents/[id]/download/route.ts` (Line 12)
- **Evidence**: Differing signatures across route handlers.
- **Recommended Fix**: Standardize all dynamic route handlers on `await params` matching Next.js 14/15 standards.
- **Required Verification**: Run `npx tsc --noEmit` and execute integration tests for dynamic routes.
