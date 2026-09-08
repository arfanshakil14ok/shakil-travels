# SHAKIL GLOBAL RECRUITMENT — ENTERPRISE RECRUITMENT PLATFORM

> **Full-Stack Recruitment ERP + Public Portal + Candidate Self-Service Portal + Double-Entry Accounting Ledger + Visa Lifecycle Management + Executive BI & Analytics Hub**
>
> High-performance, production-ready overseas recruitment and immigration management platform for **SHAKIL GLOBAL RECRUITMENT**. Built with **Next.js 14 (App Router)**, **React 18**, **TypeScript 5**, **PostgreSQL 16+**, **Prisma ORM 5.22**, **Tailwind CSS**, and **S3-Compatible Cloud Storage**.

---

## 🌟 Platform Overview

The platform provides a unified architecture serving three primary spaces connected to a PostgreSQL database:

1. **Public Information Portal (`/`)**:
   - Modern corporate portal in **Bangla (Noto Sans Bengali)** and **English**.
   - Features: Overseas Job Demands, Country Guides, Visa Requirements, 5-Step Process, Migrant Worker Guidance, Scam Awareness, and Legal Disclaimers.
2. **Candidate Self-Service Portal (`/portal`)**:
   - Mobile-first dashboard for overseas job applicants.
   - Features: Registration & profile management, job applications, secure document uploads, interview schedules, visa tracking, digital invoices, payment receipts, and in-app notifications.
3. **Admin ERP Console (`/admin`)**:
   - Comprehensive back-office ERP for recruitment agencies.
   - Features: 12-Stage controlled recruitment pipeline, Candidate & Employer management, Document verification & versioning, Embassy interview scheduling, Visa tracking & 8-point departure readiness checklist, Double-entry accounting & invoicing with customer ledger, Multi-channel communications (Email, SMS, WhatsApp), Executive BI & analytics with RFC 4180 CSV streaming exports, 99 granular RBAC permissions, and Audit logs.

---

## 🚀 Technology Stack

| Component | Technology | Version / Specification |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router, Server Components) | 14.2.35 |
| **Frontend UI** | React, TypeScript, Tailwind CSS | React 18.3.1, TS 5.7.3, Tailwind 3.4.1 |
| **Database** | PostgreSQL with Prisma ORM | PostgreSQL 16+, Prisma 5.22.0 |
| **Authentication** | Dual-session JWT (`jose`) + HttpOnly Secure Cookies | Staff (`sgr_session`), Candidate (`sgr_portal_session`) |
| **File Storage** | S3-Compatible Storage Provider / Local Private Disk | Direct AWS SigV4 signed REST client (AWS, R2, MinIO) |
| **Communications** | Multi-channel decoupled engine | SMTP/Resend/SendGrid, SSL Wireless/Twilio, Meta Cloud API |
| **Containerization** | Multi-stage Docker build | Alpine Linux runtime (`node:20-alpine`), non-root |

---

## 📋 System Requirements

- **Node.js**: `v20.x LTS` recommended (minimum `v18.17.0+`)
- **Package Manager**: `npm` `v10+` (or `pnpm` / `yarn`)
- **Database**: PostgreSQL `v16+` (standard or cloud-managed: AWS RDS, Supabase, Neon, etc.)
- **Operating System**: Linux (Ubuntu 22.04+ / Alpine), macOS, or Windows Server

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd shakil-global-recruitment
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the environment template and configure your connection credentials:

```bash
# For local development:
cp .env.example .env

# For production deployments:
cp .env.production.example .env.production
```

> [!NOTE]
> Review [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for the complete configuration matrix of required and optional environment variables.

### 4. Database Setup & Migrations

Generate the Prisma Client:
```bash
npx prisma generate
```

Apply database migrations (Deterministic schema execution):
```bash
# Production migration execution:
npm run db:migrate:prod
```

Check migration status:
```bash
npm run db:migrate:status
```

Seed initial reference data, roles, and administrative accounts (Fresh database only):
```bash
npx prisma db seed
```

---

## 💻 Running the Application

### Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
- **Public Portal**: `http://localhost:3000`
- **Candidate Portal**: `http://localhost:3000/portal`
- **Admin ERP Console**: `http://localhost:3000/admin`
- **Admin Login**: `http://localhost:3000/admin/login`

### Production Build & Execution
```bash
# 1. Build optimized production bundle
npm run build

# 2. Start production server
npm run start
```

---

## 🐳 Docker Deployment

The repository includes a multi-stage production [Dockerfile](Dockerfile) optimized for security, performance, and minimal image size (~120MB).

### Build & Run with Docker
```bash
# Build production container
docker build -t shakil-global-recruitment:latest .

# Run container with production environment
docker run -d \
  --name shakil-global-app \
  -p 3000:3000 \
  --env-file .env.production \
  --restart always \
  shakil-global-recruitment:latest
```

### Docker Compose
```bash
docker compose up -d
```

---

## 🔍 Health Checks & Observability

- **Liveness Probe**: `GET /api/health`
  - Returns `{"status":"ok","uptime":...,"environment":...}` with HTTP 200.
- **Readiness Probe**: `GET /api/health/ready`
  - Performs live PostgreSQL database ping (`SELECT 1`) and verifies system readiness.
  - Returns HTTP 200 when healthy; HTTP 503 if database connection fails.

---

## 🧪 Automated Testing & Verification

The application includes 117 automated end-to-end and production readiness checks:

```bash
# Run Production Readiness Suite (40 checks):
npx tsx scripts/verify-production-readiness.ts

# Run End-to-End User Flow Audit (46 checks):
npx tsx scripts/audit-e2e-flows.ts

# Run Core Architecture & Phases 5–8 Suite (31 checks):
npx tsx scripts/verify-phase5-phase8.ts
```

---

## 🛡️ Security & Architecture Standards

1. **Dual-Session Segregation**: Staff internal sessions (`sgr_session`) and candidate sessions (`sgr_portal_session`) use separate cryptographic signing keys, preventing cross-privilege escalation.
2. **Private Document Storage**: All uploaded files are stored in private cloud storage (S3) or secure private disk (`uploads/private`). Downloads are proxied through an authenticated route with strict ownership verification.
3. **IDOR & Cross-Account Defense**: Candidate portal routes strictly enforce applicant identity matching (`assertApplicantOwnership`).
4. **Financial Arithmetic**: All ledger postings, invoices, payments, and balances use PostgreSQL `DECIMAL(12,2)` / `Prisma.Decimal` with atomic transactions.
5. **Data Sanitization**: Passwords, tokens, API keys, card numbers, and private URLs are automatically redacted in server logs.

---

## 📚 Deployment Documentation

Detailed operational guides and runbooks are available in the `docs/` directory:

- [docs/DEPLOYMENT-HANDOFF.md](docs/DEPLOYMENT-HANDOFF.md) — Comprehensive master handoff report
- [docs/DEPLOYMENT-CHECKLIST.md](docs/DEPLOYMENT-CHECKLIST.md) — Step-by-step deployment procedure
- [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) — Complete environment variable specification
- [docs/PRODUCTION-DATABASE.md](docs/PRODUCTION-DATABASE.md) — Database backup, restoration, and tuning
- [docs/SECURITY.md](docs/SECURITY.md) — Enterprise security policies and audit results
- [docs/DISASTER-RECOVERY.md](docs/DISASTER-RECOVERY.md) — Backup schedules and recovery procedures
