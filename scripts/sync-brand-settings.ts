import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Syncing brand system settings in database...');

  const settings = [
    {
      key: 'company.name',
      value: 'SHAKIL GLOBAL MANPOWER',
      group: 'company',
      description: 'Official registered company name',
    },
    {
      key: 'company.address',
      value: 'ইসলামপুর মোড়, ডায়াবেটিক হাসপাতালের সামনে, পাসপোর্ট অফিস রোড, নেত্রকোনা-২৪০০',
      group: 'company',
      description: 'Headquarters physical address',
    },
    {
      key: 'company.phone',
      value: '01913681771',
      group: 'company',
      description: 'Official telephone and hotline',
    },
    {
      key: 'company.logo',
      value: '/brand/logo.svg',
      group: 'company',
      description: 'Brand logo path',
    },
    {
      key: 'license_number',
      value: 'RL-1892',
      group: 'company',
      description: 'Government Recruiting License Number',
    },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
    console.log(`Updated setting: ${s.key} = ${s.value}`);
  }

  console.log('All brand system settings synced successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
