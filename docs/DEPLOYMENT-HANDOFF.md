# SHAKIL GLOBAL RECRUITMENT — PRODUCTION DEPLOYMENT HANDOFF REPORT

**System**: SHAKIL GLOBAL RECRUITMENT Platform  
**System Type**: Enterprise Recruitment ERP + Public Website + Applicant Self-Service Portal + Double-Entry Accounting Ledger + Visa Management + Communications Platform  
**Version**: 1.0.0 Production Release Candidate  
**Status**: **READY FOR DEPLOYMENT**  
**Generated At**: 2026-09-08  

---

## 1. System Architecture & Metadata

| Specification | Target Production Standard | Verified Current Value |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | Next.js 14.2.35 |
| **Frontend Engine** | React 18 Server Components & Client Hydration | React 18.3.1 |
| **Language** | TypeScript 5 (Strict Type Checking) | TypeScript 5.7.3 |
| **Styling** | Tailwind CSS 3 with PostCSS | Tailwind CSS 3.4.1 |
| **Runtime Environment** | Node.js 20 LTS (Active Long Term Support) | Node.js 20.x (Compatible with 18.17+) |
| **Package Manager** | npm (v10+) | npm 10.x |
| **Database Engine** | PostgreSQL 16+ (Standard or Cloud Managed) | PostgreSQL 16.2 |
| **Database ORM** | Prisma ORM | Prisma 5.22.0 |
| **Production Build Command** | `npm run build` | Compiles Prisma Client + Next.js optimized bundles (133/133 routes) |
| **Production Start Command** | `npm run start` | `next start -p 3000` (or Docker standalone server) |
| **Migration Command** | `npm run db:migrate:prod` | `prisma migrate deploy` (deterministic SQL execution) |
| **Database Status Command** | `npm run db:migrate:status` | `prisma migrate status` |

---

## 2. Production Build & Test Scorecard

| Verification Suite | Scenarios / Checks | Result | Details |
| :--- | :---: | :---: | :--- |
| **Production Readiness Suite** (`scripts/verify-production-readiness.ts`) | 40 / 40 | **PASSED** | Environment validation, Comms production guards, Payment idempotency, S3/local storage isolation, Document MIME/size limits, Secret redaction |
| **End-to-End User Flow Audit** (`scripts/audit-e2e-flows.ts`) | 46 / 46 | **PASSED** | Complete lifecycle flows: Public visitor, Candidate registration, Document review, Interview, Visa pipeline, Double-entry invoices & payments, Ledger balance, Cross-account isolation |
| **Core Architecture & Phase Verification** (`scripts/verify-phase5-phase8.ts`) | 31 / 31 | **PASSED** | 99 RBAC permissions, Country & Visa rules, 8-Point departure checklist, Public inquiries, BI funnel, Rate limiting, XSS/Traversals |
| **Prisma Migration Verification** (`npm run db:migrate:status`) | 1 Baseline | **PASSED** | Migration `20260907000000_init` verified applied and up to date |
| **Production Next.js Build** (`npm run build`) | 133 Routes | **PASSED** | Zero TypeScript compilation errors, zero lint blockers, all static and dynamic routes compiled |

---

## 3. Database & Persistence Architecture

### A. Engine & Connection Strategy
- **Engine**: PostgreSQL 16+
- **Connection URI Format**:
  ```text
  postgresql://<username>:<password>@<host>:<port>/<database>?schema=public&sslmode=require&connection_limit=20
  ```
- **Connection Pooling**:
  - In serverless or containerized environments with auto-scaling, route connections through **PgBouncer** or **AWS RDS Proxy** using transaction-level pooling.
  - Set `connection_limit=20` to prevent connection exhaustion under heavy load.
- **Financial Precision**:
  - All monetary values in `Invoice`, `InvoiceItem`, `Payment`, and `CustomerLedger` utilize high-precision PostgreSQL `DECIMAL(12,2)`.
  - Stored and calculated as `Prisma.Decimal` in backend logic, preventing IEEE-754 floating point rounding drift.
  - Overpayment prevention and double-entry balance validation are enforced through atomic database transactions (`prisma.$transaction`).
  - Idempotent payment recording prevents duplicate charges on network retries via unique `transactionId` indexing.

### B. Schema Migrations & Baseline Initialization
- The database schema is strictly version-controlled via Prisma Migrate in `prisma/migrations/`.
- Baseline migration identifier: `20260907000000_init`.
- **Production Migration Command**:
  ```bash
  npm run db:migrate:prod
  ```
  *(Executes `prisma migrate deploy`, which applies pending SQL migrations safely without creating new migrations or dropping tables).*

---

## 4. Production File Storage Architecture

### A. Cloud Storage Abstraction (`src/lib/storage/index.ts`)
The application features a provider-agnostic storage abstraction supporting:
1. **AWS S3**
2. **Cloudflare R2**
3. **MinIO** (Self-hosted)
4. **Wasabi Cloud Storage**
5. **DigitalOcean Spaces**

### B. Storage Security & Access Control Matrix
- **Private Bucket**: All objects are stored in a 100% private cloud bucket with `x-amz-acl: private` and server-side encryption (`AES256`).
- **Zero Direct URLs**: Document URLs are never stored as public bucket links. All database records store relative internal object keys (e.g. `documents/{applicantId}/{timestamp}_{filename}.pdf`).
- **Authorized Download Proxy**: All downloads are served through `/api/documents/[id]/download`:
  - Enforces dual authentication and authorization:
    1. Internal staff member possessing `DOCUMENT_VIEW` permission (or `SUPER_ADMIN`).
    2. Authenticated candidate portal applicant who is the verified owner of the document (`applicantId === session.applicantId`).
  - Rejects cross-candidate unauthorized access attempts with HTTP 403 Forbidden.
- **Document Versioning**:
  - Consecutive uploads of the same document type for an applicant automatically archive prior versions (`isLatest: false`) and increment the `version` integer (`version: prior.version + 1`).
- **File Validation**:
  - Maximum upload size: **10 MB**.
  - Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`.
  - Disallowed types (e.g. executables, scripts) are rejected with HTTP 400.
- **Production Storage Guard**:
  - In production (`NODE_ENV=production`), the application enforces S3 cloud storage.
  - Local disk storage is blocked unless explicitly enabled via `STORAGE_ALLOW_LOCAL_IN_PRODUCTION="true"` (for persistent VM storage only).

---

## 5. Authentication & RBAC Security

### A. Dual-Session Cryptographic Isolation

| Session Type | Target Users | Cookie Name | Signing Secret | Token Type |
| :--- | :--- | :--- | :--- | :--- |
| **Staff ERP Session** | Admins, Recruiters, Accountants, Visa Officers | `sgr_session` | `AUTH_SECRET` / `JWT_SECRET` | HMAC-SHA256 JWT |
| **Candidate Portal Session** | Registered Overseas Job Candidates | `sgr_portal_session` | `PORTAL_JWT_SECRET` | HMAC-SHA256 JWT |

- `AUTH_SECRET` and `PORTAL_JWT_SECRET` **must be distinct high-entropy keys** (64-character hex strings).
- Cross-token forgery is mathematically impossible due to separate signing secrets and payload schema separation.

### B. Cookie Security Flags (Production HTTPS)
- `HttpOnly: true` (Blocks access from JavaScript / XSS)
- `SameSite: 'lax'` (CSRF mitigation)
- `Secure: true` (Enforced automatically when `NODE_ENV === 'production'`)
- `Path: '/'`

### C. Granular RBAC Permissions
- 99 permissions mapped across 12 operational modules:
  - Users & Roles, Candidates, Jobs, Pipeline, Documents, Interviews, Visa, Accounting/Invoicing, Reports, Communications, Audit Logs, System Settings.
- Default system roles: `SUPER_ADMIN`, `RECRUITMENT_MANAGER`, `RECRUITER`, `ACCOUNTANT`, `VISA_OFFICER`.

---

## 6. External Communications Architecture

Outbound communications are decoupled through provider-agnostic interfaces in `src/lib/comms/`:

1. **Transactional Email (`src/lib/comms/email.ts`)**:
   - Supported Providers: `SMTP` (Standard, Mailgun, Amazon SES, SendGrid SMTP), `RESEND`, `SENDGRID`.
   - Production Guard: Setting `EMAIL_PROVIDER="MOCK"` in production returns a clear configuration error.
2. **Transactional SMS (`src/lib/comms/sms.ts`)**:
   - Supported Providers: `SSL_WIRELESS` (Bangladesh telecom certified), `TWILIO`, `BANGLALINK`.
   - Production Guard: Production mode blocks `MOCK` SMS dispatcher.
3. **WhatsApp Business API (`src/lib/comms/whatsapp.ts`)**:
   - Supported Providers: `META_CLOUD_API` (Official Meta Graph API), `TWILIO`.
   - Production Guard: Production mode blocks `MOCK` WhatsApp dispatcher.

All dispatched messages generate persistent communication logs in the `CommunicationLog` table for compliance tracking.

---

## 7. Complete Environment Configuration Matrix

| Variable Name | Purpose | Required / Optional | Scope | Default / Example |
| :--- | :--- | :---: | :---: | :--- |
| `NODE_ENV` | Sets execution mode (`production`, `development`) | **Required** | Server & Build | `production` |
| `PORT` | Local network port for HTTP listener | Optional | Server-only | `3000` |
| `APP_URL` | Canonical server base URL for redirects & emails | **Required** | Server-only | `https://shakilglobal.com` |
| `NEXT_PUBLIC_APP_URL` | Public base URL exposed to frontend browser | **Required** | Public / Client | `https://shakilglobal.com` |
| `DATABASE_URL` | PostgreSQL connection string | **Required** | Server-only | `postgresql://user:pass@host:5432/dbname?schema=public&sslmode=require` |
| `AUTH_SECRET` | Staff ERP HMAC-SHA256 session secret (64 hex) | **Required** | Server-only | *Random 64-character hex string* |
| `JWT_SECRET` | Alias for `AUTH_SECRET` | Optional | Server-only | *Same as AUTH_SECRET* |
| `COOKIE_NAME` | Staff session cookie identifier | Optional | Server-only | `sgr_session` |
| `PORTAL_JWT_SECRET` | Candidate portal session secret (64 hex) | **Required** | Server-only | *Random 64-character hex string (distinct)* |
| `STORAGE_PROVIDER` | Private document storage backend (`S3`, `LOCAL`) | **Required** | Server-only | `S3` |
| `STORAGE_REGION` | AWS S3 region identifier | Required if S3 | Server-only | `us-east-1` (or your target region) |
| `STORAGE_BUCKET` | S3 bucket name | Required if S3 | Server-only | `shakil-global-documents-prod` |
| `STORAGE_ACCESS_KEY` | S3 IAM access key ID | Required if S3 | Server-only | *Your IAM access key* |
| `STORAGE_SECRET_KEY` | S3 IAM secret access key | Required if S3 | Server-only | *Your IAM secret key* |
| `STORAGE_ENDPOINT` | Custom S3 endpoint URL (for R2 / MinIO / Wasabi) | Optional | Server-only | Leave blank for standard AWS S3 |
| `STORAGE_ALLOW_LOCAL_IN_PRODUCTION` | Safety override to permit local disk in production | Optional | Server-only | `false` |
| `EMAIL_PROVIDER` | Email provider (`SMTP`, `RESEND`, `SENDGRID`) | **Required** | Server-only | `SMTP` |
| `SMTP_HOST` | Outbound SMTP server hostname | Required if SMTP | Server-only | `smtp.mailgun.org` |
| `SMTP_PORT` | Outbound SMTP port | Required if SMTP | Server-only | `587` |
| `SMTP_USER` | Outbound SMTP username | Required if SMTP | Server-only | `postmaster@mg.shakilglobal.com` |
| `SMTP_PASS` | Outbound SMTP password | Required if SMTP | Server-only | *Your SMTP password* |
| `SMTP_FROM` | Outbound From address header | Optional | Server-only | `Shakil Global <no-reply@shakilglobal.com>` |
| `SMS_PROVIDER` | SMS gateway provider (`SSL_WIRELESS`, `TWILIO`) | **Required** | Server-only | `SSL_WIRELESS` |
| `SMS_API_KEY` | SMS gateway API key | Required if SMS | Server-only | *Your SMS API key* |
| `SMS_SENDER_ID` | Alphanumeric SMS sender ID | Optional | Server-only | `SHAKILGLB` |
| `WHATSAPP_PROVIDER` | WhatsApp provider (`META_CLOUD_API`, `TWILIO`) | **Required** | Server-only | `META_CLOUD_API` |
| `WHATSAPP_API_KEY` | WhatsApp system access token | Required if WA | Server-only | *Your Meta Graph system token* |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp business phone ID | Required if WA | Server-only | *Your phone number ID* |
| `PAYMENT_PROVIDER` | Payment driver (`MANUAL`, `BKASH`, `SSLCOMMERZ`)| Optional | Server-only | `MANUAL` |

---

## 8. Health Monitoring & Observability

### A. Health Endpoints
- **Liveness Probe**: `GET /api/health`
  - Returns HTTP 200 with uptime, timestamp, and active environment.
  - Used by AWS ALB, Cloudflare, Kubernetes, or Docker healthchecks for container liveness.
- **Readiness Probe**: `GET /api/health/ready`
  - Executes live database ping (`SELECT 1`) to verify PostgreSQL connectivity.
  - Confirms schema status and system readiness.
  - Returns HTTP 200 when ready, HTTP 503 if database connection fails.

### B. Secret Sanitization & Error Handling
- The platform incorporates `sanitizeData()` (`src/lib/utils.ts`):
  - Automatically redacts passwords, tokens, API keys, CVVs, card numbers, and private URLs in application logs.
  - Runtime errors thrown to API consumers never leak database connection strings or secret keys.

---

## 9. Docker & Container Deployment

### A. Multi-Stage Dockerfile
A production-hardened `Dockerfile` is provided in the repository root:
- **Stage 1 (deps)**: Installs production dependencies and builds Prisma Client.
- **Stage 2 (builder)**: Builds Next.js optimized production bundles.
- **Stage 3 (runner)**: Minimal Alpine Linux runtime image running as non-root user `nextjs:nodejs` (UID/GID 1001).
- **Container Footprint**: ~120 MB.

### B. Docker Build & Run
```bash
# Build production Docker image
docker build -t shakil-global-recruitment:latest .

# Run container with environment file
docker run -d \
  --name shakil-global-app \
  -p 3000:3000 \
  --env-file .env.production \
  --restart always \
  shakil-global-recruitment:latest
```

---

## 10. Multi-Environment Runbook

### A. LOCAL DEVELOPMENT
1. Clone the repository and navigate to the project directory:
   ```bash
   cd "s:\TRAVELS\shakil travels\sk-global"
   ```
2. Copy the development environment template:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate Prisma Client and apply migrations:
   ```bash
   npx prisma generate
   npm run db:migrate:prod
   ```
5. Seed base administrative data (if fresh database):
   ```bash
   npx prisma db seed
   ```
6. Start the local development server:
   ```bash
   npm run dev
   ```
   *(Access ERP at `http://localhost:3000/login` and Candidate Portal at `http://localhost:3000/portal/login`)*.

---

### B. STAGING / QA ENVIRONMENT
1. Deploy code to the staging host or container cluster.
2. Configure `.env.staging` with staging PostgreSQL database and testing S3 bucket.
3. Run migrations:
   ```bash
   npm run db:migrate:prod
   ```
4. Build the application:
   ```bash
   npm run build
   ```
5. Run automated verification suites:
   ```bash
   npx tsx scripts/verify-production-readiness.ts
   npx tsx scripts/audit-e2e-flows.ts
   npx tsx scripts/verify-phase5-phase8.ts
   ```
6. Start the staging server:
   ```bash
   npm run start
   ```

---

### C. PRODUCTION DEPLOYMENT
1. **Pre-Flight Validation**:
   - Ensure PostgreSQL 16+ is running with SSL enabled.
   - Ensure S3 bucket is created with block-public-access enabled.
   - Generate production secrets using:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Fill out `.env.production` on the production host.
2. **Apply Database Migrations**:
   ```bash
   npm run db:migrate:prod
   ```
   *(Verify with `npm run db:migrate:status` to ensure schema is up to date).*
3. **Build the Production Bundle**:
   ```bash
   npm run build
   ```
4. **Launch Application Process**:
   - Using PM2 Process Manager:
     ```bash
     pm2 start npm --name "shakil-global-prod" -- run start -- -p 3000
     pm2 save
     pm2 startup
     ```
   - Or using Docker:
     ```bash
     docker compose -f docker-compose.prod.yml up -d
     ```
5. **Post-Deployment Verification**:
   - Check `curl http://localhost:3000/api/health` -> returns `{"status":"ok"}`.
   - Check `curl http://localhost:3000/api/health/ready` -> returns `{"status":"ready","database":"connected"}`.
   - Verify HTTPS certificate on public domain `https://shakilglobal.com`.

---

## 11. Backup, Disaster Recovery & Rollback Strategy

### A. Database Backup Runbook
Execute automated daily backups using `pg_dump`:
```bash
# Automated compressed SQL snapshot
pg_dump "$DATABASE_URL" -F c -b -v -f "/backup/shakil_db_$(date +%Y%m%d_%H%M%S).dump"

# Retain snapshots for 30 days; mirror offsite to encrypted S3 backup bucket.
```

### B. Database Restore Verification
To restore a snapshot into a staging or recovery instance:
```bash
pg_restore -d "$DATABASE_URL" -v "/backup/shakil_db_20260908_120000.dump"
```

### C. Application Release Rollback
If a newly deployed version exhibits unforeseen issues:
1. Revert to the previous Docker image tag or git commit:
   ```bash
   docker stop shakil-global-app
   docker run -d --name shakil-global-app -p 3000:3000 --env-file .env.production shakil-global-recruitment:previous-stable
   ```
2. For PM2:
   ```bash
   git checkout <last-stable-commit>
   npm run build
   pm2 restart shakil-global-prod
   ```

---

## 12. Known Limitations & Architecture Notes

1. **Provider Independence**:
   - No code is tightly coupled to a single vendor.
   - S3 storage uses standard SigV4 REST calls without third-party vendor lock-in.
   - Email, SMS, and WhatsApp use decoupled repository adapters; switching providers requires changing `.env` variables only.
2. **Node.js Process Clustering**:
   - In bare-metal or single-VM production, use PM2 cluster mode or a reverse proxy (Nginx / Cloudflare) to distribute load across all available CPU cores.
3. **Database Concurrency**:
   - For workloads exceeding 500 concurrent active users, enable PgBouncer or managed connection pooling to optimize database thread allocation.

---

## 13. Final Deployment Readiness Scorecard

```
================================================================================
                   SHAKIL GLOBAL RECRUITMENT — FINAL SCORECARD
================================================================================
  1. Project Architecture & Stack Alignment:      READY (Next.js 14, Node 20 LTS)
  2. Database Schema & Prisma Migrations:         READY (Deterministic baseline applied)
  3. Cloud Document Storage & Security:           READY (Private S3 + Signed Auth Proxy)
  4. Authentication & RBAC Isolation:             READY (Dual-session JWT, 99 Permissions)
  5. Cross-Candidate IDOR Defense:                READY (Strict server-side verification)
  6. Financial Accounting & Invoicing:            READY (Decimal precision, Idempotent)
  7. Communications & Production Guards:          READY (Decoupled, MOCK blocked in prod)
  8. Production Logging & Data Sanitization:      READY (Passwords, tokens, URLs redacted)
  9. Docker Containerization:                     READY (Multi-stage non-root build)
 10. Health Probes & Monitoring:                  READY (/api/health, /api/health/ready)
 11. Production Build & TypeScript Checks:        READY (0 errors, 133/133 routes)
 12. End-to-End Automated Test Suites:           READY (117/117 total checks passed)
================================================================================
  FINAL SYSTEM STATUS:                            READY FOR DEPLOYMENT
================================================================================
```
