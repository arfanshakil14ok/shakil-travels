# Security Architecture & Hardening Guide
**System**: SHAKIL GLOBAL RECRUITMENT Platform  

---

## 1. Dual-Authentication & Session Isolation
A critical security requirement is preventing privilege escalation between internal recruitment staff and external job candidates.

- **Staff Authentication**:
  - Cookie: `sgr_session`
  - Signed with: `JWT_SECRET`
  - Payload: `{ userId, email, roleId }`
  - RBAC: Verified against 99 system permissions (`requirePermission()`).
- **Candidate Portal Authentication**:
  - Cookie: `sgr_portal_session`
  - Signed with: `PORTAL_JWT_SECRET` (distinct secret)
  - Payload: `{ applicantId, applicantNumber, phone, fullName }`
  - Access: Scoped strictly to the authenticated applicant's own record.

A compromised candidate session cookie CANNOT authenticate as staff, and vice versa.

---

## 2. Insecure Direct Object Reference (IDOR) Defense
Candidate data isolation is strictly enforced at the server-side database query layer:

1. **Applications**:
   ```ts
   // Query always scoped to applicant.id
   const app = await prisma.application.findUnique({ where: { id } });
   if (!app || app.applicantId !== applicant.id) {
     return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
   }
   ```
2. **Documents**:
   Candidate can only list and upload documents tied to their own `applicantId`.
3. **Invoices & Receipts**:
   Candidates can only query financial statements matching their own `applicantId` or associated `Customer` record.

---

## 3. Financial Integrity & Decimal Precision
JavaScript `Number` floating-point arithmetic is vulnerable to rounding errors (`0.1 + 0.2 !== 0.3`).
In Shakil Global Recruitment:
- All monetary amounts use PostgreSQL `Decimal(12, 2)`.
- Prisma client handles inputs as `Prisma.Decimal`.
- Invoices enforce immutable line item records and automated ledger adjustments.
- System receipts are uniquely identified by sequential codes (`SGR-RCP-2026-XXXXXX`).

---

## 4. Injection Defense & Content Sanitization
- **SQL Injection**: Prevented by parameterized queries through Prisma ORM.
- **Cross-Site Scripting (XSS)**: Handled via React JSX escaping and `src/lib/security.ts` sanitization.
- **CSV Formula Injection**: Universal CSV export sanitizes spreadsheet formula triggers (`=`, `+`, `-`, `@`) and enforces UTF-8 BOM encoding.
- **Directory Traversal**: File upload paths are sanitized to prevent `../` attacks.

---

## 5. Regulatory Compliance & Anti-Fraud Notices
In accordance with international recruitment regulations:
- No public page or candidate view guarantees 100% visa approval.
- All visa progress screens display mandatory disclaimers noting that visa decisions rest solely with foreign sovereign embassies.
- Official anti-scam awareness portal (`/scam-awareness`) educates candidates against recruitment fraud and fake visa agents.
