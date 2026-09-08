import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function runBackup() {
  console.log('--- Starting Shakil Global Database Backup ---');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups', `snapshot-${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const tables = [
    { name: 'users', model: prisma.user },
    { name: 'roles', model: prisma.role },
    { name: 'permissions', model: prisma.permission },
    { name: 'countries', model: prisma.country },
    { name: 'jobCategories', model: prisma.jobCategory },
    { name: 'employers', model: prisma.employer },
    { name: 'jobs', model: prisma.job },
    { name: 'applicants', model: prisma.applicant },
    { name: 'applicantProfiles', model: prisma.applicantProfile },
    { name: 'customers', model: prisma.customer },
    { name: 'applications', model: prisma.application },
    { name: 'documentTypes', model: prisma.documentType },
    { name: 'documents', model: prisma.document },
    { name: 'interviews', model: prisma.interview },
    { name: 'visaInformation', model: prisma.visaInformation },
    { name: 'visaApplications', model: prisma.visaApplication },
    { name: 'visaAppointments', model: prisma.visaAppointment },
    { name: 'migrantInformation', model: prisma.migrantInformation },
    { name: 'services', model: prisma.service },
    { name: 'invoices', model: prisma.invoice },
    { name: 'invoiceItems', model: prisma.invoiceItem },
    { name: 'payments', model: prisma.payment },
    { name: 'refunds', model: prisma.refund },
    { name: 'financialTransactions', model: prisma.financialTransaction },
    { name: 'communicationTemplates', model: prisma.communicationTemplate },
    { name: 'communicationLogs', model: prisma.communicationLog },
    { name: 'inquiries', model: prisma.inquiry },
    { name: 'notifications', model: prisma.notification },
    { name: 'auditLogs', model: prisma.auditLog },
  ];

  const summary: Record<string, number> = {};

  for (const table of tables) {
    try {
      const records = await (table.model as any).findMany();
      fs.writeFileSync(
        path.join(backupDir, `${table.name}.json`),
        JSON.stringify(records, null, 2),
        'utf-8'
      );
      summary[table.name] = records.length;
      console.log(`✓ Backed up ${table.name}: ${records.length} records`);
    } catch (err: any) {
      console.error(`✗ Error backing up ${table.name}:`, err.message);
    }
  }

  const manifest = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    totalTables: tables.length,
    tableCounts: summary,
  };

  fs.writeFileSync(
    path.join(backupDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  console.log('--- Backup Completed Successfully ---');
  console.log(`Location: ${backupDir}`);
}

runBackup()
  .catch((e) => {
    console.error('Fatal backup failure:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
