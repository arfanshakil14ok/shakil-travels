# SHAKIL GLOBAL RECRUITMENT — TECHNICAL ARCHITECTURE DOCUMENTATION

## 1. System Overview

**SHAKIL GLOBAL RECRUITMENT** is an enterprise-grade full-stack recruitment and immigration management platform designed to orchestrate the complete lifecycle of international manpower recruitment:

$$\text{Applicant} \longrightarrow \text{Job} \longrightarrow \text{Application} \longrightarrow \text{Documents} \longrightarrow \text{Interview} \longrightarrow \text{Selection} \longrightarrow \text{Invoice} \longrightarrow \text{Payment} \longrightarrow \text{Visa} \longrightarrow \text{Departure} \longrightarrow \text{Reports}$$

### Key Architectural Pillars:
1. **Separation of Concerns**: Clean boundary between Public Website (`/`) and Admin ERP (`/admin`), backed by unified data models and security middleware.
2. **Database-Driven RBAC**: Fine-grained permissions enforced strictly on server-side actions, avoiding reliance on UI hiding.
3. **Auditability & Traceability**: Complete audit logging with automatic redaction of sensitive credentials.
4. **Data Integrity & Financial Precision**: Standardized use of UUIDs for internal IDs, formatted business IDs for operations, and `Decimal(12,2)` precision for all billing amounts.
5. **Defense in Depth**: Secure cookies, bcrypt password hashing, HTTP headers (CSP, X-Frame-Options, etc.), rate limiting, and private document storage.

---

## 2. Relational Database Architecture

All models are defined in `prisma/schema.prisma` targeting PostgreSQL.

### Core Foundation Models (Active in Phase 1)
- **User**: Represents platform administrators and staff members (`id`, `name`, `email`, `phone`, `passwordHash`, `roleId`, `isActive`, `lastLoginAt`, `createdAt`, `updatedAt`).
- **Role**: System access level roles (`SUPER_ADMIN`, `ADMIN`, `RECRUITMENT_STAFF`, `ACCOUNTS_STAFF`, `CONTENT_MANAGER`, `VIEWER`).
- **Permission**: Atomic capability codes (`DASHBOARD_VIEW`, `USER_CREATE`, `USER_EDIT`, `SETTINGS_MANAGE`, etc.).
- **RolePermission**: Join table assigning permissions to specific roles with cascade deletion.
- **SystemSetting**: Database-backed platform configurations (`company.name`, `system.currency`, `system.timezone`, `system.prefix_*`).
- **AuditLog**: Immutable compliance trail capturing actor, action, entity, entity ID, client IP, user agent, old value diff, and new value diff.
- **Notification**: Alerts and messages with read/unread status and metadata payloads.

### Prepared Relational Models (Ready for Future Phases)
- **Applicant & ApplicantProfile**: Biometric and demographic profile, passport details, skills, and emergency contacts.
- **Country**: Permitted destination countries (Saudi Arabia, UAE, Qatar, Kuwait, Oman, Malaysia, Singapore, Japan).
- **Employer**: International sponsors and foreign recruitment agencies.
- **JobCategory & Job**: Categorized overseas job demands with vacancies, currency, requirements, and salary terms.
- **Application & ApplicationStatusHistory**: Candidate application pipeline with chronological stage progression tracking.
- **DocumentType & Document**: Private candidate credentials (Passport, NID, Medical Clearance, Police Clearance, CV).
- **Interview**: Employer interview scheduling, location, notes, and pass/fail evaluation.
- **VisaApplication**: Embassy submission date, visa number, stamping status, and expiry tracking.
- **Invoice & InvoiceItem**: Candidate billing with subtotal, tax, discount, total, paid amount, and balance due.
- **PaymentMethod & Payment**: Multi-installment payments (Cash, Bank, bKash, Nagad) linked to candidate invoices.
- **BlogPost & MigrantInformation**: Content and safe migration knowledgebase for candidate welfare.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Permission Code | SUPER_ADMIN | ADMIN | RECRUITMENT_STAFF | ACCOUNTS_STAFF | VIEWER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `DASHBOARD_VIEW` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `USER_VIEW` | ✅ | ✅ | ❌ | ❌ | ✅ |
| `USER_CREATE` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `USER_EDIT` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `USER_DELETE` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `APPLICANT_VIEW` | ✅ | ✅ | ✅ | ❌ | ✅ |
| `APPLICANT_CREATE` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `APPLICANT_EDIT` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `APPLICANT_DELETE` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `JOB_VIEW` | ✅ | ✅ | ✅ | ❌ | ✅ |
| `JOB_CREATE` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `JOB_EDIT` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `JOB_DELETE` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `APPLICATION_VIEW` | ✅ | ✅ | ✅ | ❌ | ✅ |
| `APPLICATION_MANAGE` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `DOCUMENT_VIEW` | ✅ | ✅ | ✅ | ❌ | ✅ |
| `DOCUMENT_MANAGE` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `INVOICE_VIEW` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `INVOICE_CREATE` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `INVOICE_EDIT` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `PAYMENT_VIEW` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `PAYMENT_CREATE` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `PAYMENT_EDIT` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `REPORT_VIEW` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `SETTINGS_MANAGE` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `AUDIT_VIEW` | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 4. Identification System

To maintain optimal database performance while providing human-readable identifiers on candidate paper receipts and visas:

- **Internal Database IDs**: Universal Unique Identifiers (UUID v4) for primary keys.
- **Operational Business Codes**:
  - Applicant: `SGR-[YEAR]-[SEQUENCE]` (e.g. `SGR-2026-000001`)
  - Application: `SGR-APP-[YEAR]-[SEQUENCE]` (e.g. `SGR-APP-2026-000001`)
  - Invoice: `SGR-INV-[YEAR]-[SEQUENCE]` (e.g. `SGR-INV-2026-000001`)

Prefixes and formatting are dynamically resolved through `SystemSetting` records.

---

## 5. Security & Privacy Framework

1. **Authentication Flow**:
   - `POST /api/auth/login` validates credentials against salted `bcrypt` hashes.
   - Generates an encrypted JWT signed with `HS256`.
   - Dispatches a secure cookie (`HttpOnly`, `SameSite=lax`, `Secure` in production).
   - Deactivated users (`isActive: false`) are blocked at middleware and API levels.
2. **Rate Limiting**:
   - Sliding window limiter prevents brute-force attempts on sensitive endpoints.
3. **Audit Trail**:
   - Captures `LOGIN_SUCCESS`, `LOGIN_FAILED`, `USER_CREATED`, `USER_UPDATED`, `USER_DEACTIVATED`, `SETTING_UPDATED`.
   - Automatically redacts passwords, hashes, and secrets via `sanitizeData()`.
4. **Document Storage Protection**:
   - Candidate documents are stored outside the public directory (`uploads/private/`).
   - Downloads require authenticated session tokens with permission verification.

---

## 6. Directory Structure

```
sk-global/
├── README.md
├── docs/
│   └── ARCHITECTURE.md
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── scripts/
│   ├── db-runner.js
│   └── verify-system.ts
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── jobs/page.tsx
│   │   │   ├── countries/page.tsx
│   │   │   ├── visa-info/page.tsx
│   │   │   ├── migrant-info/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   └── contact/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── audit-logs/page.tsx
│   │   │   └── [coming-soon-modules]/page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── settings/
│   │   │   ├── audit-logs/
│   │   │   └── dashboard/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── admin/
│   │   ├── public/
│   │   └── ui/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── rbac.ts
│   │   ├── prisma.ts
│   │   ├── audit.ts
│   │   ├── id-generator.ts
│   │   ├── rate-limit.ts
│   │   ├── storage/
│   │   ├── notifications/
│   │   ├── utils.ts
│   │   └── validations/
│   ├── middleware.ts
│   └── types/
│       └── index.ts
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
└── package.json
```
