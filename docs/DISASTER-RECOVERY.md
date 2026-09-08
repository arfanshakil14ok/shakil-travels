# Disaster Recovery & Business Continuity Plan
**System**: SHAKIL GLOBAL RECRUITMENT Platform  

---

## 1. Targets & Objectives
- **Recovery Point Objective (RPO)**: < 1 hour (maximum acceptable data loss).
- **Recovery Time Objective (RTO)**: < 30 minutes (time to return system to operational status).

---

## 2. Emergency Recovery Playbooks

### Scenario A: Database Node Failure or Host Crash
1. Verify container or node status via cloud console / Docker:
   ```bash
   docker ps -a
   ```
2. If storage volume is intact, restart the database container or switch to the standby replica.
3. If primary database is unrecoverable, provision a fresh PostgreSQL instance.
4. Execute `pg_restore` using the latest hourly automated snapshot.
5. Update `DATABASE_URL` in environment configuration and restart the Next.js runtime.
6. Verify readiness endpoint: `curl https://platform.shakilglobal.com/api/health/ready`.

---

### Scenario B: Application Deployment Failure
1. The App Router application runs as an immutable production artifact (`.next` standalone or Docker image).
2. Rollback immediately to the previous tagged container image:
   ```bash
   docker pull ghcr.io/shakilglobal/recruitment-erp:previous-stable
   docker-compose up -d --no-deps web
   ```
3. Run `curl https://platform.shakilglobal.com/api/health` to confirm liveness.

---

### Scenario C: Secret Compromise (`JWT_SECRET` or Database Credentials)
1. Generate new 64-character random secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update `JWT_SECRET` and `PORTAL_JWT_SECRET` in environment variables.
3. Redeploy Next.js web application.
4. Note: Rotating JWT secrets immediately invalidates all active staff and applicant sessions, forcing a secure re-login across all clients.
