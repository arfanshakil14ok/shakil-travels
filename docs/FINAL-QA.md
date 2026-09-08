# Final Production QA & Verification Protocol
**System**: SHAKIL GLOBAL RECRUITMENT Platform  
**Target**: Complete Enterprise Sign-Off (Phases 1 through 8)  

---

## 1. Test Execution Matrix

| # | Test Scenario | Expected Outcome | Verified |
| :--- | :--- | :--- | :--- |
| **QA-01** | Staff Authentication & RBAC | Staff login creates `sgr_session`; non-permitted routes return HTTP 403 Forbidden. | **PASS** |
| **QA-02** | Candidate Portal Registration | Candidate registers, receives sequential `SGR-2026-XXXXXX` number, sets password, auto-logs in. | **PASS** |
| **QA-03** | Dual-Session Isolation | Candidate session cookie cannot access `/admin/*` API endpoints. | **PASS** |
| **QA-04** | IDOR Defense | Candidate A cannot read or mutate Candidate B's applications, documents, or visa details. | **PASS** |
| **QA-05** | Duplicate Application Prevention | Candidate attempting to apply twice to the same job receives HTTP 409 Conflict. | **PASS** |
| **QA-06** | Inbound Website Lead Conversion | Website contact inquiry is submitted, staff reviews notes, converts to candidate without duplication. | **PASS** |
| **QA-07** | Multi-Channel Dispatch & Log | System dispatches notification via Email/SMS/WhatsApp/In-App, respects candidate opt-out preferences, logs in `communication_logs`. | **PASS** |
| **QA-08** | Visa Lifecycle & Readiness | Visa file tracks sequential number `SGR-VISA-2026-XXXXXX`, evaluates 8-point departure readiness checklist. | **PASS** |
| **QA-09** | Financial Precision & Receipts | Monetary calculations execute with PostgreSQL Decimal; unique receipt codes generated; aging report aggregates accurately. | **PASS** |
| **QA-10** | 12-Stage Funnel & BI Analytics | Executive dashboard renders real-time stats; funnel accurately calculates stage-to-stage conversion and drop-off rates. | **PASS** |
| **QA-11** | Universal CSV Export | Streams RFC 4180 CSV with UTF-8 BOM and spreadsheet formula injection protection. | **PASS** |
| **QA-12** | Health Probes & Backup | `/api/health` returns 200; `/api/health/ready` executes live DB ping; backup script generates verified snapshot. | **PASS** |
