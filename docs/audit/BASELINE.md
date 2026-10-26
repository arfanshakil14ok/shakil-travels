# SHAKIL TRAVELS — Phase 00: Baseline Audit
**Audit Date**: October 25, 2026  
**Auditor**: Senior Software Architect, Security Reviewer & QA Lead  
**Repository**: `sk-global` (SHAKIL TRAVELS Recruitment ERP)  

---

## 1. Environment & Host Specification

| Component | Detected Specification | Verification Status | Notes |
| :--- | :--- | :--- | :--- |
| **Operating System** | Windows (x64) | Verified | PowerShell 5.1 & CMD available |
| **Node.js Runtime** | Node.js v22.x / NPM | Verified | `npm.cmd` operational |
| **TypeScript** | TypeScript 5.7.3 (`npx tsc`) | Verified | Type checking passes with 0 errors |
| **Prisma Engine** | Prisma CLI 5.22.0 | Verified | Schema validates successfully |
| **Dart SDK** | Dart 3.13.7 (stable) | Verified | Located in Flutter cache |
| **Flutter SDK** | Flutter 3.16+ installed | Verified | Path: `S:\PSAutoRecover\shakil-traves-apk\flutter` |
| **Database Engine** | PostgreSQL (Neon Cloud & Local Embedded) | Verified | Configured in `prisma/schema.prisma` & `scripts/db-runner.js` |

---

## 2. Repository Layout & Directory Structure

```text
sk-global/
├── .env                              # Environment configuration (secrets preserved)
├── package.json                      # Next.js web application dependencies & scripts
├── package-lock.json                 # Node package lockfile
├── tsconfig.json                     # TypeScript strict compiler options
├── tailwind.config.ts                # Tailwind CSS configuration
├── next.config.js                    # Next.js 14 configuration
├── prisma/
│   ├── schema.prisma                 # Core schema (2,207 lines, 50+ models)
│   ├── seed.ts                       # Database seeder (roles, users, lookup data)
│   └── migrations/
│       ├── migration_lock.toml       # Prisma migration lock
│       └── 20260907000000_init/      # Initial migration baseline
├── src/
│   ├── app/
│   │   ├── (public)/                 # Public portal (Home, Jobs, Countries, Slip Verify)
│   │   ├── portal/                   # Candidate authenticated portal
│   │   ├── admin/                    # Executive Admin ERP dashboard & modules
│   │   ├── staff/                    # Operational Staff processing dashboard
│   │   └── api/                      # 212 Next.js App Router API endpoints
│   ├── components/                   # Reusable UI components & application slip view
│   ├── lib/                          # Auth, RBAC, Storage, QR, Prisma, Audit utilities
│   ├── types/                        # TypeScript type definitions & permission codes
│   └── middleware.ts                 # Route protection middleware (Admin, Staff, Portal)
├── mobile/                           # Native Flutter 3.x / Dart 3 mobile client
│   ├── pubspec.yaml                  # Flutter package specification
│   ├── android/                      # Android Gradle project & keystore setup
│   ├── assets/                       # Brand icons, logos, bilingual i18n JSONs
│   ├── lib/
│   │   ├── main.dart                 # Flutter entrypoint
│   │   ├── app/                      # App widget, theme, typography, app router
│   │   ├── core/                     # Config, Dio client, interceptors, secure storage
│   │   ├── features/                 # Auth, Candidate, Staff, Admin feature modules
│   │   └── shared/                   # Reusable buttons, cards, logo, text fields
│   └── test/                         # Core and feature unit & widget tests
├── scripts/                          # 35+ validation, testing, and migration scripts
└── docs/
    ├── ARCHITECTURE.md               # Historical architecture notes
    └── audit/                        # Phase 00 Baseline Audit reports (current)
```

---

## 3. Existing Scripts & Commands Catalog

### Web & Backend (`package.json`)
| Script | Command | Purpose | Verification Result |
| :--- | :--- | :--- | :--- |
| `dev` | `next dev` | Start development server | Functional |
| `build` | `prisma generate && next build` | Production compile | Functional |
| `lint` | `next lint` | Run ESLint static analysis | **Failed** (Missing ESLint config) |
| `db:start` | `node scripts/db-runner.js` | Start embedded PostgreSQL instance | Functional |
| `db:generate` | `prisma generate` | Generate Prisma client bindings | Functional |
| `db:push` | `prisma db push` | Push schema directly to database | Functional |
| `db:migrate:prod` | `prisma migrate deploy` | Execute pending Prisma migrations | Read-only checked |
| `db:migrate:status`| `prisma migrate status` | Inspect migration drift status | Requires live DB connection |
| `db:seed` | `tsx prisma/seed.ts` | Seed database with initial records | Functional |
| `test:verify` | `tsx scripts/verify-system.ts`| Comprehensive system verification | Functional |

### Verification Scripts (`scripts/`)
- `scripts/test-phase2-auth.ts`: Dual-auth token isolation test (**10/10 PASS**).
- `scripts/test-phase4-rbac.ts`: Staff & Admin RBAC permission gate test (**12/12 PASS**).
- `scripts/audit-e2e-flows.ts`: End-to-end applicant processing lifecycle test.
- `scripts/verify-all-fixes.ts`: Regression test suite for prior architectural fixes.

---

## 4. Git Working Tree Baseline

- **Branch**: `main` (Synchronized with `origin/main` at commit `d1f40fc`)
- **Uncommitted User Changes Preserved**:
  - `src/lib/auth.ts`: Added mobile `Authorization: Bearer <token>` support to `getCurrentUser()`.
  - `src/lib/portal-auth.ts`: Added mobile `Authorization: Bearer <token>` support to `getCurrentApplicant()`.
  - `src/app/api/auth/login/route.ts`: Returning JWT token in JSON payload alongside cookie.
  - `src/app/api/portal/auth/login/route.ts`: Returning JWT token in JSON payload alongside cookie.
  - `src/middleware.ts`: Secret isolation aligned between web cookies and mobile tokens.
  - `mobile/lib/`: Role selection screen, candidate navigation, secure storage, and login screens.
  - `scripts/test-phase2-auth.ts` & `scripts/test-phase4-rbac.ts`: Automated test suites.
