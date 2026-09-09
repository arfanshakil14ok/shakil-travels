const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const totalJobs = await prisma.job.count();
  const jobsWithoutEmployer = await prisma.job.count({ where: { employerId: null } });
  const totalApps = await prisma.application.count();
  const appsWithNullJobEmployer = await prisma.application.count({
    where: { job: { employerId: null } }
  });
  const appsWithoutEmployer = await prisma.application.count({ where: { employerId: null } });
  const appsWithoutCountry = await prisma.application.count({ where: { countryId: null } });

  console.log('STATS:', JSON.stringify({
    totalJobs,
    jobsWithoutEmployer,
    totalApps,
    appsWithNullJobEmployer,
    appsWithoutEmployer,
    appsWithoutCountry
  }, null, 2));

  const jobsNoEmp = await prisma.job.findMany({
    where: { employerId: null },
    select: { id: true, jobCode: true, title: true, status: true }
  });
  console.log('Jobs without employer:', JSON.stringify(jobsNoEmp, null, 2));

  const appsNoEmp = await prisma.application.findMany({
    where: {
      OR: [
        { job: { employerId: null } },
        { employerId: null }
      ]
    },
    select: {
      id: true,
      applicationCode: true,
      applicationNumber: true,
      job: { select: { id: true, title: true, employerId: true } }
    },
    take: 10
  });
  console.log('Sample applications with null employer:', JSON.stringify(appsNoEmp, null, 2));

  await prisma.$disconnect();
}

check().catch(console.error);
