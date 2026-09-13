import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fineTuneSampleRecords() {
  console.log('=== FINE-TUNING MAXIMUM 2 SAMPLE RECORDS FOR ALL TEST ENTITIES ===');

  // 1. Interviews: Keep 2
  const allInterviews = await prisma.interview.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (allInterviews.length > 2) {
    const delIds = allInterviews.slice(2).map((i) => i.id);
    await prisma.interview.deleteMany({ where: { id: { in: delIds } } });
    console.log(`Pruned ${delIds.length} excess interviews.`);
  }

  // 2. Invoices & Payments: Keep 2
  const allInvoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (allInvoices.length > 2) {
    const delInvoiceIds = allInvoices.slice(2).map((i) => i.id);
    await prisma.refund.deleteMany({ where: { invoiceId: { in: delInvoiceIds } } }).catch(() => {});
    await prisma.receipt.deleteMany({ where: { invoiceId: { in: delInvoiceIds } } }).catch(() => {});
    await prisma.payment.deleteMany({ where: { invoiceId: { in: delInvoiceIds } } }).catch(() => {});
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: delInvoiceIds } } }).catch(() => {});
    await prisma.invoice.deleteMany({ where: { id: { in: delInvoiceIds } } });
    console.log(`Pruned ${delInvoiceIds.length} excess invoices.`);
  }

  const allPayments = await prisma.payment.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (allPayments.length > 2) {
    const delPaymentIds = allPayments.slice(2).map((p) => p.id);
    await prisma.payment.deleteMany({ where: { id: { in: delPaymentIds } } });
    console.log(`Pruned ${delPaymentIds.length} excess payments.`);
  }

  // 3. Documents: Keep 2
  const allDocs = await prisma.document.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (allDocs.length > 2) {
    const delDocIds = allDocs.slice(2).map((d) => d.id);
    await prisma.document.deleteMany({ where: { id: { in: delDocIds } } });
    console.log(`Pruned ${delDocIds.length} excess documents.`);
  }

  console.log('\n=== FINAL VERIFIED DATABASE RECORD COUNTS ===');
  const finalCounts = {
    Countries: await prisma.country.count(),
    Jobs: await prisma.job.count(),
    Employers: await prisma.employer.count(),
    JobCategories: await prisma.jobCategory.count(),
    Applicants: await prisma.applicant.count(),
    Applications: await prisma.application.count(),
    Interviews: await prisma.interview.count(),
    Invoices: await prisma.invoice.count(),
    Payments: await prisma.payment.count(),
    Documents: await prisma.document.count(),
    AuditLogs: await prisma.auditLog.count(),
    Users: await prisma.user.count(),
    Roles: await prisma.role.count(),
    Permissions: await prisma.permission.count(),
    Settings: await prisma.systemSetting.count(),
  };
  console.table(finalCounts);
}

fineTuneSampleRecords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
