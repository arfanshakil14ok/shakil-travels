import prisma from '../src/lib/prisma';

async function main() {
  console.log('--- Testing Job Categories and Blog Operations ---');

  // 1. Job Categories test
  const catCount = await prisma.jobCategory.count();
  console.log(`Current Job Categories in DB: ${catCount}`);

  let testCat = await prisma.jobCategory.findFirst({ where: { slug: 'test-qa-sector' } });
  if (!testCat) {
    testCat = await prisma.jobCategory.create({
      data: {
        name: 'Quality Assurance Testing Sector',
        slug: 'test-qa-sector',
        description: 'Automated verification and quality control recruitment',
        icon: 'ShieldCheck',
        isActive: true,
      },
    });
    console.log(`Created test category: ${testCat.name} (${testCat.id})`);
  } else {
    console.log(`Found existing test category: ${testCat.name}`);
  }

  // 2. Blog Posts test
  const blogCount = await prisma.blogPost.count();
  console.log(`Current Blog Posts in DB: ${blogCount}`);

  let testPost = await prisma.blogPost.findFirst({ where: { slug: 'test-recruitment-advisory' } });
  if (!testPost) {
    testPost = await prisma.blogPost.create({
      data: {
        title: 'Official Overseas Recruitment Policy 2026',
        slug: 'test-recruitment-advisory',
        excerpt: 'Important guidelines for Bangladeshi expatriate workers.',
        content: 'Full article content outlining BMET compliance and RL-1892 licensed recruitment.',
        isPublished: true,
        publishedAt: new Date(),
      },
    });
    console.log(`Created test blog post: ${testPost.title} (${testPost.id})`);
  } else {
    console.log(`Found existing test post: ${testPost.title}`);
  }

  // Cleanup test records
  await prisma.jobCategory.delete({ where: { id: testCat.id } });
  await prisma.blogPost.delete({ where: { id: testPost.id } });
  console.log('Cleaned up test records.');

  console.log('✅ JOB CATEGORIES & BLOG DB OPERATIONS 100% OPERATIONAL!');
}

main()
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
