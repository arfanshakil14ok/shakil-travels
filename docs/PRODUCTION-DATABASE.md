# SHAKIL GLOBAL RECRUITMENT — PRODUCTION DATABASE RUNBOOK

**System**: SHAKIL GLOBAL RECRUITMENT Platform  
**Database**: PostgreSQL 16+ Enterprise  
**ORM**: Prisma Client v5.22.0  
**Target Document**: Database Maintenance, Migrations, Backup, Restore & Safety  

---

## 1. Production Migration Procedure

### ⚠️ Golden Rule for Production
> **NEVER** run `npx prisma migrate dev` or `npx prisma db push` against a production database.
> These commands may result in interactive schema resets, temporary lock escalation, or irreversible data loss.

### Standard Step-by-Step Migration Process
When deploying new schema updates to production:

1. **Pre-Migration Backup (Mandatory)**:
   Always take a full transactional snapshot before executing any migration:
   ```bash
   # Execute the automated snapshot utility
   npx tsx scripts/backup-db.ts
   
   # Or execute standard pg_dump via shell
   pg_dump "$DATABASE_URL" -Fc -f "backups/sgr_pre_migration_$(date +%Y%m%d_%H%M%S).dump"
   ```

2. **Verify Database Connectivity & Health**:
   ```bash
   curl -I https://shakilglobal.com/api/health/ready
   ```

3. **Apply Pending Migrations**:
   Run the deterministic Prisma deployment command:
   ```bash
   npx prisma migrate deploy
   ```
   This command applies all pending migration SQL scripts in chronological order without prompting or altering existing data.

4. **Verify Schema Status**:
   ```bash
   npx prisma migrate status
   ```
   Ensure output reports: `Database schema is up to date!`.

---

## 2. Backup & Disaster Recovery Requirement

- **Frequency**:
  - Automated Daily full database snapshot at `02:00 AM UTC+6`.
  - Transaction WAL archiving every 15 minutes for Point-in-Time Recovery (PITR).
  - Pre-deployment snapshot before every application upgrade.

- **Snapshot Validation**:
  Test restore procedures quarterly using `scripts/restore-db.ts` to confirm that tables, relations, and decimal precision restore cleanly without data truncation.

---

## 3. Rollback Considerations

- **Forward-Compatible Migrations**:
  Design database migrations with additive steps (e.g. add nullable column first, backfill data, then add constraints in a subsequent deploy).
- **Rollback Procedure**:
  If a migration causes runtime anomalies:
  1. Stop application traffic or activate maintenance mode page.
  2. Restore the pre-migration snapshot:
     ```bash
     npx tsx scripts/restore-db.ts <snapshot-manifest-path>
     ```
  3. Redeploy the prior stable application version.
  4. Validate database consistency using `scripts/verify-phase5-phase8.ts`.

---

## 4. Production Seed Strategy

### What MUST Be Seeded in Production:
- Core system settings (prefixes, agency license details, default currencies).
- System RBAC roles (`SUPER_ADMIN`, `ADMIN`, `RECRUITER`, `ACCOUNTS_MANAGER`, `VISA_OFFICER`).
- Enterprise permissions catalog (101 system permissions).
- Standard document types (`PASSPORT`, `POLICE_CLEARANCE`, `MEDICAL_CERTIFICATE`, `PHOTO`, `TRADE_CERTIFICATE`).
- Approved destination countries and initial job categories.

### What MUST NEVER Be Seeded in Production:
- Mock applicants or fictitious candidates.
- Dummy applications or test interview records.
- Fake financial invoices, dummy payments, or test ledger transactions.

---

## 5. Production Safety & Performance Guidelines

1. **Connection Pooling**:
   - Use PgBouncer or managed connection pooling (e.g. AWS RDS Proxy, Supabase Pooler) to prevent connection saturation under concurrent traffic spikes.
   - Append `&connection_limit=20&pool_timeout=10` to `DATABASE_URL` in production.

2. **SSL Mode**:
   - Production connection strings must enforce TLS encryption: `?sslmode=require`.

3. **Index Optimization**:
   - High-throughput query filters (`applicantNumber`, `jobCode`, `invoiceNumber`, `status`, `applicantId`) are indexed. Do not remove composite indexes without architectural review.

4. **Monetary Precision**:
   - All financial balances are stored as `Decimal(12,2)`. Never cast monetary columns to IEEE-754 floating-point numbers in raw SQL scripts.
