import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { FALLBACK_COUNTRIES, FALLBACK_JOBS } from '@/lib/homepage-fallback';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const countriesCount = await prisma.country.count();
    const jobsCount = await prisma.job.count();

    // If countries or jobs are 0, seed them
    if (countriesCount === 0) {
      for (const c of FALLBACK_COUNTRIES) {
        await prisma.country.upsert({
          where: { code: c.code },
          update: {
            name: c.name,
            slug: c.slug,
            flag: c.flag,
            continent: c.continent,
            currency: c.currency,
            currencyCode: c.currencyCode,
            description: c.description,
            recruitmentStatus: c.recruitmentStatus,
            featured: c.featured,
            displayOrder: c.displayOrder,
            isActive: true,
          },
          create: {
            id: c.id,
            name: c.name,
            code: c.code,
            slug: c.slug,
            flag: c.flag,
            continent: c.continent,
            currency: c.currency,
            currencyCode: c.currencyCode,
            description: c.description,
            recruitmentStatus: c.recruitmentStatus,
            featured: c.featured,
            displayOrder: c.displayOrder,
            isActive: true,
          },
        });
      }
    }

    const updatedCountriesCount = await prisma.country.count();
    const updatedJobsCount = await prisma.job.count();

    return NextResponse.json({
      success: true,
      message: 'System database status checked / seeded successfully.',
      data: {
        countriesCount: updatedCountriesCount,
        jobsCount: updatedJobsCount,
      },
    });
  } catch (error: any) {
    console.error('System seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database seeding error' },
      { status: 500 }
    );
  }
}
