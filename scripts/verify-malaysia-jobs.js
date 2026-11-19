const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.job.findMany({
    where: { country: { code: 'MY' } },
    include: { employer: true, jobCategory: true },
    orderBy: { jobCode: 'asc' },
  });

  console.log(`\n========================================`);
  console.log(`TOTAL MALAYSIA JOBS IN DATABASE: ${jobs.length}`);
  console.log(`========================================\n`);

  jobs.forEach((j, i) => {
    console.log(`${i + 1}. [${j.jobCode}] ${j.title}`);
    console.log(`   Employer : ${j.employer?.companyName} (${j.employer?.city})`);
    console.log(`   Category : ${j.jobCategory?.name}`);
    console.log(`   Age Req  : ${j.ageMin} - ${j.ageMax} Years`);
    console.log(`   Salary   : ${j.currency} ${j.salaryMin} - ${j.salaryMax} / Month`);
    console.log(`   Status   : ${j.status} | Vacancy: ${j.vacancyCount}`);
    console.log(`   Slug     : ${j.slug}`);
    console.log(`----------------------------------------`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
