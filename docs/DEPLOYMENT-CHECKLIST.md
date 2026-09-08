# SHAKIL GLOBAL RECRUITMENT — DEPLOYMENT CHECKLIST & RUNBOOK

**System**: SHAKIL GLOBAL RECRUITMENT Platform  
**Target Environments**: Local Development, Staging Pre-Release, Production  
**Document Version**: 1.0.0-Release  

---

## 1. Local Development Setup

To run the application locally on a developer workstation:

- [ ] **Install Dependencies**:
  ```bash
  npm install
  ```
- [ ] **Environment Setup**:
  ```bash
  # Copy template to active local environment
  cp .env.example .env
  ```
  Ensure `.env` contains valid database credentials (`DATABASE_URL`) and local development secret keys.
- [ ] **Database Setup**:
  - If using the local embedded PostgreSQL daemon:
    ```bash
    npm run db:start
    ```
  - Or connect your local PostgreSQL 16+ instance.
- [ ] **Prisma Generation**:
  ```bash
  npm run db:generate
  ```
- [ ] **Database Migration / Schema Sync**:
  ```bash
  npm run db:migrate:status
  ```
  Apply baseline schema and seed standard metadata:
  ```bash
  npm run db:seed
  ```
- [ ] **Start Development Server**:
  ```bash
  npm run dev
  ```
  Navigate to `http://localhost:3000`.
- [ ] **Production Build Test**:
  ```bash
  npm run build
  ```
- [ ] **Production Start Test**:
  ```bash
  npm run start
  ```

---

## 2. Staging Pre-Release Environment

Before releasing to production, deploy to an isolated staging server to validate third-party network connectivity and data integrity:

- [ ] **Staging Environment Variables**:
  Provision `.env.production` on the staging host with:
  - `NODE_ENV=production`
  - `DATABASE_URL` (Staging isolated PostgreSQL database)
  - `AUTH_SECRET` & `PORTAL_JWT_SECRET` (High-entropy keys generated for staging)
  - `APP_URL=https://staging.shakilglobal.com`
- [ ] **Database Connectivity**:
  Confirm staging database has TLS/SSL enabled and responds to `SELECT 1`.
- [ ] **Storage Backend**:
  Verify write/read permissions on `/app/uploads/private` or configure staging S3 bucket.
- [ ] **Authentication Verification**:
  - Test Staff login at `/admin/login`.
  - Test Candidate Portal registration and login at `/portal/login`.
  - Confirm cookies have `SameSite=Lax`, `HttpOnly=true`, and `Secure=true`.
- [ ] **Email / SMS / WhatsApp Configuration**:
  - Set test credentials for transactional email (`SMTP_HOST` or `EMAIL_API_KEY`).
  - Set test SMS gateway keys (`SMS_API_KEY`).
  - Set WhatsApp test phone number ID (`WHATSAPP_PHONE_NUMBER_ID`).
  - Confirm notification deliveries without mock fallbacks.
- [ ] **Payment Configuration**:
  - Verify manual counter/bank transfer entry at `/admin/invoices/[id]`.
  - Test partial payments, remaining due calculation, and automated receipt issuance.
- [ ] **Migration Procedure**:
  ```bash
  npx prisma migrate deploy
  ```
- [ ] **Automated Testing Suite on Staging**:
  Execute complete integration verification:
  ```bash
  npx tsx scripts/verify-phase5-phase8.ts
  npx tsx scripts/audit-e2e-flows.ts
  npx tsx scripts/verify-production-readiness.ts
  ```
  Confirm 0 failures before promoting to production.

---

## 3. Production Environment Deployment

- [ ] **Production Environment Variables**:
  - Provision `.env.production` securely (via AWS Parameter Store, Doppler, Vault, or secure server environment).
  - Verify all required variables documented in `docs/ENVIRONMENT.md` are defined.
  - Verify zero placeholder secrets or default dev keys are present.
- [ ] **Production Database Connection**:
  - Managed PostgreSQL 16+ cluster (e.g. AWS RDS, DigitalOcean Managed DB, Supabase).
  - Connection pooling configured (PgBouncer with 20–30 max connections).
  - SSL encryption enforced (`sslmode=require`).
- [ ] **Production Migration Procedure**:
  1. Take pre-migration snapshot:
     ```bash
     npx tsx scripts/backup-db.ts
     ```
  2. Apply migrations:
     ```bash
     npx prisma migrate deploy
     ```
  3. Seed system roles, permissions & core settings:
     ```bash
     npm run db:seed
     ```
- [ ] **Private File Storage**:
  - Verify persistent volume attached to `/app/uploads/private` or S3 bucket IAM policy configured.
  - Test document upload and download authorization.
- [ ] **Authentication & Security**:
  - Confirm dual session tokens (`AUTH_SECRET` and `PORTAL_JWT_SECRET`) are distinct 64-char hex strings.
  - Confirm rate limiter is active on authentication routes.
- [ ] **External Services Integration**:
  - Official SMTP relay (Mailgun / SES) SPF, DKIM, and DMARC DNS records verified.
  - Telecom SMS gateway Sender ID (`SHAKILGLB`) authorized.
  - Meta Cloud API permanent system user token active with verified WhatsApp business number.
- [ ] **Domain, DNS & HTTPS**:
  - DNS A / CNAME records pointing to production load balancer or reverse proxy.
  - TLS 1.3 / SSL certificates provisioned via Let's Encrypt or Cloudflare.
  - HSTS, CSP, and X-Frame-Options headers verified via `next.config.mjs`.
- [ ] **Monitoring & Health Probes**:
  - Configure uptime monitor for `/api/health` (HTTP 200).
  - Configure deep readiness monitor for `/api/health/ready` (checks DB latency and memory).
- [ ] **Automated Backup Schedule**:
  - Configure daily snapshot cron at `02:00 AM UTC+6` using `scripts/backup-db.ts`.
  - Verify snapshot artifacts stored in off-site encrypted storage.
- [ ] **Rollback Plan**:
  - In case of critical issue during deployment, execute rollback runbook in `docs/PRODUCTION-DATABASE.md`.
  - Restore pre-migration backup via `scripts/restore-db.ts`.
  - Revert application binary or container image to previous release tag.
