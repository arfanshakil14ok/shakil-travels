const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const countries = await prisma.country.findMany({
    select: { id: true, code: true, name: true, slug: true, isActive: true },
    orderBy: { code: 'asc' },
  });
  console.log('=== Countries ===');
  console.log(JSON.stringify(countries, null, 2));

  const categories = await prisma.jobCategory.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });
  console.log('=== Categories ===');
  console.log(JSON.stringify(categories, null, 2));

  const jobsCount = await prisma.job.groupBy({
    by: ['countryId'],
    _count: { id: true },
  });
  console.log('=== Jobs by CountryId ===');
  console.log(JSON.stringify(jobsCount, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
