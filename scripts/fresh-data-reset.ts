import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = 'admin@shakilglobal.com';
const SUPER_ADMIN_ID = 'dc4b5d78-adae-4dfe-bf98-065d53292118';

async function main() {
  console.log('====================================================');
  console.log('  SHAKIL GLOBAL RECRUITMENT V2.0 - FRESH DATA RESET');
  console.log('====================================================\n');

  // 1. Verify Super Admin exists
  const superAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { id: SUPER_ADMIN_ID },
        { email: SUPER_ADMIN_EMAIL },
      ],
    },
  });

  if (!superAdmin) {
    throw new Error('CRITICAL ERROR: Super Admin account not found! Aborting reset.');
  }

  console.log(`[PROTECTED] Super Admin found: ${superAdmin.email} (${superAdmin.id})`);

  // 2. Cascade delete applicant-related child data
  console.log('\n[STEP 1/6] Cleaning Candidate Child Records (Enrollments, Documents, Invoices)...');
  
  // Training child records
  await prisma.trainingAttendance.deleteMany({});
  await prisma.trainingProgress.deleteMany({});
  await prisma.trainingAssessment.deleteMany({});
  await prisma.trainingCertificate.deleteMany({});
  await prisma.trainingEnrollment.deleteMany({});
  await prisma.trainingApplication.deleteMany({});

  // Application child records
  await prisma.applicationScreening.deleteMany({});
  await prisma.applicationStatusHistory.deleteMany({});
  await prisma.interview.deleteMany({});
  await prisma.recruitmentProcessingCase.deleteMany({});
  await prisma.visaApplication.deleteMany({});
  
  // Documents
  await prisma.document.deleteMany({});

  // Financial transactions for test applicants
  await prisma.invoiceItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.customer.deleteMany({});

  // Activity logs & notifications
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});

  console.log('[STEP 2/6] Deleting Applications...');
  const deletedApps = await prisma.application.deleteMany({});
  console.log(`  -> Deleted ${deletedApps.count} applications.`);

  console.log('[STEP 3/6] Deleting Applicant Profiles & Candidates...');
  await prisma.applicantProfile.deleteMany({});
  await prisma.applicantNote.deleteMany({});
  await prisma.candidateSkill.deleteMany({});
  await prisma.candidateLanguage.deleteMany({});
  await prisma.candidateEducation.deleteMany({});
  await prisma.candidateExperience.deleteMany({});
  await prisma.medicalRecord.deleteMany({});
  await prisma.clearanceRecord.deleteMany({});
  await prisma.departureRecord.deleteMany({});
  await prisma.communicationLog.deleteMany({});
  await prisma.supportTicket.deleteMany({});
  const deletedApplicants = await prisma.applicant.deleteMany({});
  console.log(`  -> Deleted ${deletedApplicants.count} applicants.`);

  console.log('[STEP 4/6] Deleting Non-SuperAdmin Staff/Test Users...');
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { not: superAdmin.id },
    },
  });
  console.log(`  -> Deleted ${deletedUsers.count} other users. Preserved Super Admin.`);

  console.log('\n[STEP 5/6] Verifying Data Invariants...');
  const totalUsers = await prisma.user.count();
  const totalApplicants = await prisma.applicant.count();
  const totalApplications = await prisma.application.count();
  const totalCountries = await prisma.country.count();
  const totalJobs = await prisma.job.count();
  const totalEmployers = await prisma.employer.count();
  const totalCategories = await prisma.jobCategory.count();
  const totalCourses = await prisma.trainingCourse.count();
  const totalCenters = await prisma.trainingCenter.count();

  console.log('\n================ POST-RESET AUDIT ================');
  console.log(`- Super Admin Accounts : ${totalUsers} (Expected: 1)`);
  console.log(`- Applicants           : ${totalApplicants} (Expected: 0)`);
  console.log(`- Applications         : ${totalApplications} (Expected: 0)`);
  console.log(`- Countries Preserved  : ${totalCountries} (Expected: 14)`);
  console.log(`- Jobs Preserved       : ${totalJobs} (Expected: 17)`);
  console.log(`- Employers Preserved  : ${totalEmployers} (Expected: 9)`);
  console.log(`- Categories Preserved : ${totalCategories} (Expected: 16)`);
  console.log(`- Training Courses     : ${totalCourses}`);
  console.log(`- Training Centers     : ${totalCenters}`);
  console.log('==================================================\n');

  if (totalUsers !== 1 || totalApplicants !== 0 || totalApplications !== 0) {
    throw new Error('Reset failed validation checks.');
  }

  console.log('SUCCESS: FRESH DATA RESET COMPLETED SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error('Reset error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
