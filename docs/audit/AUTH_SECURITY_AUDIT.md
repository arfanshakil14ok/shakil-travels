# SHAKIL TRAVELS — Phase 00: Authentication & Security Audit
**Audit Date**: October 25, 2026  
**Auditor**: Senior Software Architect & Security Reviewer  
**Scope**: Authentication, Token Lifecycles, RBAC, Trust Boundaries, Sensitive Asset Protection  

---

## 1. Trust Boundaries & Actor Personas

The system enforces four distinct trust levels:

```text
[ UNTRUSTED INTERNET ]
        │
        ├──> (Public Visitors)        : Public browsing, job viewing, tracking, public application submission.
        │
        ├──> (Candidate Persona)      : Authenticated via PORTAL_JWT_SECRET.
        │                              Owns Application, Profile, Documents, Payment history.
        │                              Strictly isolated from administrative endpoints.
        │
        ├──> (Staff Persona)          : Authenticated via JWT_SECRET with granular Role Permissions.
        │                              Processing officers, interviewers, document auditors, billing staff.
        │
        └──> (Executive Admin / Super): Authenticated via JWT_SECRET with SUPER_ADMIN / ADMIN roles.
                                       System configuration, user provisioning, global audit logs, financial reconciliation.
```

---

## 2. Token Cryptography & Verification Baseline

| Attribute | Candidate Portal Auth | Staff / Admin Auth | Verification Status |
| :--- | :--- | :--- | :--- |
| **Token Type** | JSON Web Token (JWT) | JSON Web Token (JWT) | Verified (`jose` library) |
| **Signing Algorithm**| HMAC-SHA256 (`HS256`) | HMAC-SHA256 (`HS256`) | Verified |
| **Signing Secret** | `PORTAL_JWT_SECRET` | `JWT_SECRET` | Cryptographically Isolated |
| **Token Validity** | 7 days (`604,800s`) | 24 hours (`86,400s`) | Verified in `lib/portal-auth.ts` & `lib/auth.ts` |
| **Primary Cookie** | `sgr_portal_session` | `sgr_session` | Verified (`HttpOnly`, `SameSite: Lax`) |
| **Bearer Support** | `Authorization: Bearer <token>` | `Authorization: Bearer <token>` | Verified in `getCurrentApplicant()` & `getCurrentUser()` |
| **Rate Limiting** | 5 failed attempts / 15 mins | 5 failed attempts / 15 mins | Verified in both login route handlers |

---

## 3. RBAC Implementation Verification

The RBAC system in `src/lib/rbac.ts` provides tiered guards:
- `hasPermission(user, permission)`: Evaluates permissions array; auto-bypasses for `SUPER_ADMIN`.
- `requireAuth()`: Ensures session is valid and `user.isActive === true`.
- `requirePermission(code)`: Validates specific capability (`APPLICANT_VIEW`, `DOCUMENT_VERIFY`, `PAYMENT_APPROVE`, etc.).
- `requireRole(roles)`: Ensures specific role membership.
- `requireSuperAdmin()`: Restricts access strictly to headquarters Super Admin.

**Automated Test Evidence**:  
Executed `scripts/test-phase4-rbac.ts`:
- Token Isolation: Candidate JWT rejected by Staff verifier $\rightarrow$ **PASS**
- Recruiter denied `DOCUMENT_VERIFY` $\rightarrow$ **PASS**
- Recruiter denied `SETTINGS_MANAGE` $\rightarrow$ **PASS**
- Document Officer granted `DOCUMENT_VERIFY` $\rightarrow$ **PASS**
- Deactivated user denied all operations $\rightarrow$ **PASS**
- Super Admin passes all permission checks $\rightarrow$ **PASS**

---

## 4. Security Findings & Defects

### [SEC-001] Insecure Fallback Secrets in Source Code
- **Severity**: High
- **Impact**: In `src/lib/auth.ts`, `src/lib/portal-auth.ts`, and `src/middleware.ts`, default hardcoded fallback strings are provided when `JWT_SECRET` or `PORTAL_JWT_SECRET` are not set in the environment:
  - Staff: `'sgr_enterprise_secret_key_change_in_production_2026_recruit_auth'`
  - Portal: `'sgr_portal_secure_jwt_secret_applicant_2026'`
  If a deployment fails to inject environment variables, an attacker knowing the open repository secrets could forge arbitrary administrative and candidate JWT tokens.
- **File**: `src/lib/auth.ts` (Line 8), `src/lib/portal-auth.ts` (Line 7), `src/middleware.ts` (Lines 7, 12)
- **Evidence**: Source inspection of lines above.
- **Recommended Fix**: Enforce mandatory environment variable verification on startup. If `NODE_ENV === 'production'` and the secret matches the fallback or is absent, throw a fatal process exit exception.
- **Required Verification**: Test application bootstrap in production mode without `.env`; verify application refuses to start with an explicit configuration error.

---

### [SEC-002] Missing Issuer (`iss`) and Audience (`aud`) Claims
- **Severity**: Medium
- **Impact**: While candidate and staff tokens use distinct secrets, tokens do not declare or verify explicit `iss` (issuer) or `aud` (audience) claims. Standard defense-in-depth requires verifying that a token was issued by SHAKIL TRAVELS and intended for the specific client (web vs. mobile).
- **File**: `src/lib/auth.ts` (Line 21), `src/lib/portal-auth.ts` (Line 28)
- **Evidence**: `SignJWT` call sets `.setIssuedAt()` and `.setExpirationTime()`, but omits `.setIssuer()` and `.setAudience()`.
- **Recommended Fix**: Add `.setIssuer('shakil-travels-erp')` and `.setAudience('shakil-travels-clients')` to `SignJWT`, and add corresponding validations to `jwtVerify`.
- **Required Verification**: Run `scripts/test-phase2-auth.ts` with mismatched audience; verify token rejection.

---

### [SEC-003] Inadequate RBAC on Private Document Downloads
- **Severity**: Medium
- **Impact**: In `src/app/api/documents/[id]/download/route.ts`, any authenticated staff member is permitted to download any candidate document (passport, police clearance, medical exam) regardless of whether their role has been granted `DOCUMENT_VIEW` permission.
- **File**: `src/app/api/documents/[id]/download/route.ts`, Lines 29-32
- **Evidence**:
  ```typescript
  const staffUser = await getCurrentUser();
  if (staffUser) {
    isAuthorized = true; // No permission check performed!
  }
  ```
- **Recommended Fix**: Check `hasPermission(staffUser, 'DOCUMENT_VIEW')` before authorizing staff access.
- **Required Verification**: Test downloading a document using a staff account without `DOCUMENT_VIEW`; verify HTTP 403 Forbidden.

---

### [SEC-004] Public Candidate Photo ID Enumeration
- **Severity**: Low
- **Impact**: The endpoint `/api/portal/photo/[id]` serves candidate photos based on applicant UUID without requiring session authentication. While this is intentional to allow rendering photos on printable verification slips and public QR pages, it theoretically permits unauthenticated photo enumeration if UUIDs are obtained.
- **File**: `src/app/api/portal/photo/[id]/route.ts`, Line 10
- **Evidence**: Public GET handler without `getCurrentUser()` or `getCurrentApplicant()`.
- **Recommended Fix**: Implement rate limiting on `/api/portal/photo/[id]` and consider requiring a signed verification token for slip verification URLs.
- **Required Verification**: Test high-frequency photo requests; verify rate limiting activates.

---

### [SEC-005] Middleware Excludes API Routes from Edge Verification
- **Severity**: Low (Defense-in-Depth)
- **Impact**: `src/middleware.ts` matcher only intercepts `/admin/*`, `/staff/*`, `/portal/*`, and `/candidate/*`. It does NOT intercept `/api/*`. Consequently, API endpoints depend entirely on internal route handler calls (`requireAuth`, `requirePermission`). While individual route handlers are protected, an edge filter provides a valuable second layer of defense.
- **File**: `src/middleware.ts`, Lines 128-136
- **Evidence**:
  ```typescript
  export const config = {
    matcher: ['/admin/:path*', '/staff/:path*', '/portal/:path*', '/candidate/:path*'],
  };
  ```
- **Recommended Fix**: Keep internal route handler guards as primary, but evaluate adding edge pre-checks or security headers (`X-Frame-Options`, `Content-Security-Policy`) for `/api/*` in middleware.
- **Required Verification**: Verify that unauthenticated requests to `/api/applicants` continue to receive standard 401 JSON responses rather than HTML redirects.
