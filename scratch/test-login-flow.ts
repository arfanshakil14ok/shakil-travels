import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function testLoginFlows() {
  console.log('--- Testing Login Flows ---');

  // 1. Test Admin Login Backend Credentials
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@shakilglobal.com' },
    include: { role: true },
  });

  if (!admin) {
    throw new Error('Admin user not found');
  }

  const adminPasswordMatches = await bcrypt.compare('Admin@SGR2026!', admin.passwordHash);
  console.log(`Admin user: ${admin.email} (Role: ${admin.role.name})`);
  console.log(`Password verification: ${adminPasswordMatches ? 'SUCCESS' : 'FAILED'}`);

  // 2. Test Applicant Portal candidate accounts
  const applicants = await prisma.applicant.findMany({
    take: 3,
    select: {
      id: true,
      applicantNumber: true,
      fullName: true,
      phone: true,
      email: true,
      passwordHash: true,
      isActive: true,
    },
  });

  console.log(`Found ${applicants.length} sample applicants:`);
  for (const a of applicants) {
    console.log(`- ${a.fullName} | Phone: ${a.phone} | Number: ${a.applicantNumber} | HasPassword: ${Boolean(a.passwordHash)} | Active: ${a.isActive}`);
  }

  console.log('✅ LOGIN CREDENTIALS AND BACKEND VERIFICATION COMPLETE!');
}

testLoginFlows()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
