# Database Backup & Restore Procedure
**System**: SHAKIL GLOBAL RECRUITMENT Platform  

---

## 1. Overview
The database backup architecture supports:
- Automated snapshots via `scripts/backup-db.ts`
- Integrity verification and recovery testing via `scripts/restore-db.ts`
- Standard PostgreSQL `pg_dump` and `pg_restore` commands for full production infrastructure.

---

## 2. Automated Application-Level Backup
To trigger an immediate complete table-level snapshot:

```bash
npx tsx scripts/backup-db.ts
```

Snapshots are stored in `backups/snapshot-<ISO-timestamp>/` containing:
- JSON tables for all 28 core enterprise models
- `manifest.json` with record counts, cryptographic verification timestamp, and table inventory.

---

## 3. Restore Verification Test
To verify the integrity of the latest backup snapshot:

```bash
npx tsx scripts/restore-db.ts
```

Output:
```
--- Testing Shakil Global Database Restore & Disaster Recovery ---
Verifying target snapshot: snapshot-2026-09-07T...
Manifest validated: Snapshot taken at 2026-09-07T...
✓ Verified 28 tables in snapshot with 100% integrity
--- Database Restore Test PASSED ---
```

---

## 4. Native PostgreSQL Production Backup (Recommended for Production Cron)

### Taking Backup with `pg_dump`:
```bash
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE -F c -b -v -f /var/backups/sgr_backup_$(date +%Y%m%d_%H%M%S).dump
```

### Restoring Backup with `pg_restore`:
```bash
# 1. Terminate existing connections
psql -U $PGUSER -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'sgr_production';"

# 2. Restore into target database
pg_restore -h $PGHOST -U $PGUSER -d sgr_production -v --clean --no-owner /var/backups/sgr_backup_target.dump
```
