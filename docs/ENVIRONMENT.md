# SHAKIL GLOBAL RECRUITMENT — PRODUCTION ENVIRONMENT CONFIGURATION

**System**: SHAKIL GLOBAL RECRUITMENT Platform  
**Target Environment**: Node.js 18+ / Next.js 14 Production Server / Container  
**Security Level**: High-Security Enterprise Standard  

---

## 1. Environment Configuration Matrix

The table below documents every environment variable supported by the platform, specifying its exact purpose, necessity, runtime scope, and consumer module.

| Variable Name | Purpose | Required / Optional | Where It Is Used | Scope |
| :--- | :--- | :---: | :--- | :---: |
| `NODE_ENV` | Sets runtime mode (`development`, `production`, `test`) | **Required** | Next.js runtime, logging, security toggles | Server & Build |
| `PORT` | Local network binding port for HTTP listener | Optional (Default: 3000) | Standalone Node.js server listener | Server-only |
| `APP_URL` | Canonical server base URL for internal redirects and email links | **Required** | Server redirects, emails, sitemaps | Server-only |
| `NEXT_PUBLIC_APP_URL` | Public canonical base URL exposed to frontend browser | **Required** | Frontend metadata, OpenGraph tags, assets | Public / Client-safe |
| `DATABASE_URL` | PostgreSQL connection string with SSL parameters | **Required** | Prisma Client (`src/lib/prisma.ts`), migrations | Server-only |
| `AUTH_SECRET` / `JWT_SECRET` | Primary HMAC-SHA256 signing secret for administrative staff sessions (`sgr_session`) | **Required** | Staff auth (`src/lib/auth.ts`, `src/middleware.ts`) | Server-only |
| `COOKIE_NAME` | Cookie name for administrative staff sessions | Optional (Default: `sgr_session`) | Staff authentication cookie store | Server-only |
| `PORTAL_JWT_SECRET` | Cryptographic secret for candidate portal sessions (`sgr_portal_session`). **Must be distinct from AUTH_SECRET.** | **Required** | Candidate auth (`src/lib/portal-auth.ts`) | Server-only |
| `EMAIL_PROVIDER` | Transactional email driver (`SMTP`, `RESEND`, `SENDGRID`, `MOCK`) | **Required** | Dispatcher (`src/lib/comms/email.ts`) | Server-only |
| `EMAIL_API_KEY` | API authentication key for Resend or SendGrid email providers | Required if using API-based email | Outbound email service | Server-only |
| `SMTP_HOST` | Hostname of outbound SMTP server (e.g. Mailgun, Amazon SES) | Required if `EMAIL_PROVIDER="SMTP"` | Outbound email service | Server-only |
| `SMTP_PORT` | SMTP port (e.g. `587` for STARTTLS, `465` for SSL) | Required if `EMAIL_PROVIDER="SMTP"` | Outbound email service | Server-only |
| `SMTP_USER` | SMTP authentication username / account email | Required if `EMAIL_PROVIDER="SMTP"` | Outbound email service | Server-only |
| `SMTP_PASS` | SMTP authentication password or dedicated app secret | Required if `EMAIL_PROVIDER="SMTP"` | Outbound email service | Server-only |
| `SMTP_FROM` | Default From address and display name | Optional (Default: `no-reply@shakilglobal.com`) | Outbound email headers | Server-only |
| `SMS_PROVIDER` | SMS gateway driver (`SSL_WIRELESS`, `TWILIO`, `BANGLALINK`, `MOCK`) | **Required** | SMS dispatcher (`src/lib/comms/sms.ts`) | Server-only |
| `SMS_API_KEY` | Production API authorization key for SMS gateway | Required if `SMS_PROVIDER != "MOCK"` | Outbound SMS service | Server-only |
| `SMS_SENDER_ID` | Government-approved alphanumeric Sender ID | Optional (Default: `SHAKILGLB`) | Outbound SMS header | Server-only |
| `WHATSAPP_PROVIDER` | Official WhatsApp gateway (`META_CLOUD_API`, `TWILIO`, `MOCK`) | **Required** | WhatsApp dispatcher (`src/lib/comms/whatsapp.ts`) | Server-only |
| `WHATSAPP_API_KEY` | Meta Graph API permanent system user access token | Required if `WHATSAPP_PROVIDER != "MOCK"` | Outbound WhatsApp service | Server-only |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta registered WhatsApp Business phone number ID | Required if `WHATSAPP_PROVIDER="META_CLOUD_API"` | Meta Cloud API URL builder | Server-only |
| `PAYMENT_PROVIDER` | Accounting & payment collection driver (`MANUAL`, `BKASH`, `SSLCOMMERZ`) | Optional (Default: `MANUAL`) | Financial transactions (`src/lib/accounting`) | Server-only |
| `PAYMENT_API_KEY` | Merchant API secret for online payment gateway | Required only if online gateway is active | Payment verification callback | Server-only |
| `STORAGE_PROVIDER` | Private document storage backend (`LOCAL`, `S3`) | Optional (Default: `S3` in prod, `LOCAL` in dev) | File storage (`src/lib/storage/index.ts`) | Server-only |
| `STORAGE_DIR` | Local disk filesystem directory for private files | Optional (Default: `uploads/private`) | Local storage provider fallback | Server-only |
| `STORAGE_REGION` | AWS / S3 region identifier (e.g. `us-east-1`, `ap-southeast-1`) | Required if `STORAGE_PROVIDER="S3"` | S3 SigV4 signature generator | Server-only |
| `STORAGE_BUCKET` | Cloud storage bucket name (e.g. AWS S3 / Cloudflare R2) | Required if `STORAGE_PROVIDER="S3"` | S3 SigV4 endpoint builder | Server-only |
| `STORAGE_ACCESS_KEY` | Cloud storage IAM access key ID | Required if `STORAGE_PROVIDER="S3"` | S3 SigV4 credential scope | Server-only |
| `STORAGE_SECRET_KEY` | Cloud storage IAM secret access key | Required if `STORAGE_PROVIDER="S3"` | S3 SigV4 HMAC-SHA256 signing | Server-only |
| `STORAGE_ENDPOINT` | Optional custom S3 endpoint (e.g. R2, MinIO, Wasabi) | Optional (Default: standard AWS endpoint) | S3 HTTP client | Server-only |
| `STORAGE_ALLOW_LOCAL_IN_PRODUCTION` | Explicit safety override to allow local disk storage in production VM | Optional (Default: `false`) | Production storage factory guard | Server-only |

---

## 2. Server-Side Secret Isolation Principles

1. **Zero Client Leakage**:
   - Only variables prefixed with `NEXT_PUBLIC_` are ever bundled into client-side JavaScript.
   - The platform strictly limits `NEXT_PUBLIC_` to non-sensitive values: `NEXT_PUBLIC_APP_URL`.
   - All cryptographic keys, database URIs, and third-party API tokens are 100% server-only.

2. **Dual-Session Cryptographic Isolation**:
   - `AUTH_SECRET` (used for Staff ERP access) and `PORTAL_JWT_SECRET` (used for Candidate Portal access) must be two distinct high-entropy keys.
   - Cross-token reuse is prevented by signature algorithm verification and cookie partition.

3. **Generating Strong Production Secrets**:
   To generate production-grade 256-bit cryptographic secrets, run:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

---

## 3. Production Startup Validation

The application validates the runtime environment at startup via `src/lib/config/env.ts`.

### Automatic Validation Rules:
- If `NODE_ENV === 'production'`:
  - `DATABASE_URL` must be configured.
  - `AUTH_SECRET` must be set and cannot be the default development placeholder.
  - `PORTAL_JWT_SECRET` must be set and cannot be the default development placeholder.
  - `APP_URL` must be set.
  - `EMAIL_PROVIDER`, `SMS_PROVIDER`, and `WHATSAPP_PROVIDER` must not operate silently as mock services unless explicitly handled.
- If any required variable is missing, the application logs a structured `[CONFIGURATION ERROR]` specifying the missing variable names and terminates gracefully, preventing silent failure in production.
- Secret values are **NEVER printed in error messages, console logs, or HTTP responses**.
