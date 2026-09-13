import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log('=== USERS & ROLES ===');
  console.log(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role?.name,
      isActive: u.isActive,
    }))
  );

  const superAdmin = users.find((u) => u.role?.name === 'SUPER_ADMIN');
  console.log('\n=== SUPER ADMIN IDENTIFIED ===');
  console.log(superAdmin);

  const counts = {
    users: await prisma.user.count(),
    roles: await prisma.role.count(),
    applicants: await prisma.applicant.count(),
    applications: await prisma.application.count(),
    jobs: await prisma.job.count(),
    countries: await prisma.country.count(),
    employers: await prisma.employer.count(),
    jobCategories: await prisma.jobCategory.count(),
    documents: await prisma.document.count(),
    trainingCourses: await prisma.trainingCourse.count(),
    trainingCenters: await prisma.trainingCenter.count(),
    trainingInstructors: await prisma.trainingInstructor.count(),
    trainingBatches: await prisma.trainingBatch.count(),
    trainingEnrollments: await prisma.trainingEnrollment.count(),
    invoices: await prisma.invoice.count(),
    payments: await prisma.payment.count(),
    auditLogs: await prisma.auditLog.count(),
  };

  console.log('\n=== CURRENT DATABASE COUNTS ===');
  console.log(counts);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
