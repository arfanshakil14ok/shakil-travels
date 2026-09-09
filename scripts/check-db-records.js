const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const jobs = await prisma.job.findMany({
    include: {
      country: true,
      jobCategory: true,
      employer: true,
    },
  });
  console.log('JOBS (' + jobs.length + '):');
  jobs.forEach(j => {
    console.log(` - [${j.status}] ${j.title} | ${j.country?.name} (${j.country?.code}) | ${j.jobCategory?.name} | Vacancy: ${j.vacancyCount} | Salary: ${j.salaryDisplay || j.salaryMin + '-' + j.salaryMax + ' ' + j.currency}`);
  });

  const countries = await prisma.country.findMany({
    include: {
      _count: {
        select: { jobs: true, visaInformations: true, migrantInformations: true },
      },
    },
  });
  console.log('\nCOUNTRIES (' + countries.length + '):');
  countries.forEach(c => {
    console.log(` - ${c.name} (${c.code}, slug: ${c.slug}) | Active: ${c.isActive} | Recruitment: ${c.recruitmentStatus} | Jobs: ${c._count.jobs} | Visas: ${c._count.visaInformation}`);
  });

  const visas = await prisma.visaInformation.findMany({
    include: {
      country: true,
    },
  });
  console.log('\nVISAS (' + visas.length + '):');
  visas.forEach(v => {
    console.log(` - ${v.title} | ${v.country?.name} | Type: ${v.visaType} | Active: ${v.isActive}`);
  });

  const categories = await prisma.jobCategory.findMany({
    include: {
      _count: { select: { jobs: true } },
    },
  });
  console.log('\nJOB CATEGORIES (' + categories.length + '):');
  categories.forEach(cat => {
    console.log(` - ${cat.name} (${cat.code}) | Jobs: ${cat._count.jobs}`);
  });

  await prisma.$disconnect();
}

check().catch(console.error);
