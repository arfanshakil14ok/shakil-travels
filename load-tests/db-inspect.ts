import prisma from '../src/lib/prisma';
import os from 'os';

async function main() {
  const [
    candidates,
    employers,
    jobs,
    applications,
    processingCases,
    invoices,
    payments,
    documents,
    users,
    auditLogs,
  ] = await Promise.all([
    prisma.applicant.count(),
    prisma.employer.count(),
    prisma.job.count(),
    prisma.application.count(),
    prisma.recruitmentProcessingCase.count(),
    prisma.invoice.count(),
    prisma.payment.count(),
    prisma.document.count(),
    prisma.user.count(),
    prisma.auditLog.count(),
  ]);

  const sysInfo = {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    cpuModel: os.cpus()[0]?.model,
    totalMemoryGB: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2),
    freeMemoryGB: (os.freemem() / (1024 * 1024 * 1024)).toFixed(2),
  };

  const counts = {
    candidates,
    employers,
    jobs,
    applications,
    processingCases,
    invoices,
    payments,
    documents,
    users,
    auditLogs,
  };

  console.log('=== SYSTEM HARDWARE ===');
  console.log(JSON.stringify(sysInfo, null, 2));
  console.log('=== CURRENT DATABASE COUNTS ===');
  console.log(JSON.stringify(counts, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
