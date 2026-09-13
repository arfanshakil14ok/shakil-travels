import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { medicalCenterSchema } from '@/lib/validations/processing';

export async function GET() {
  try {
    let centers = await prisma.medicalCenter.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });

    // Seed default accredited GAMCA clinics if empty
    if (centers.length === 0) {
      await prisma.medicalCenter.createMany({
        data: [
          {
            name: 'Al-Farabi Medical & Diagnostic Center (GAMCA Approved)',
            nameLocal: 'আল-ফারাবী মেডিকেল অ্যান্ড ডায়াগনস্টিক সেন্টার',
            city: 'Dhaka',
            address: 'House 14, Road 11, Block C, Banani, Dhaka',
            phone: '+88029881122',
            isGamca: true,
            status: 'ACTIVE',
          },
          {
            name: 'Ibn Sina Medical Screening Center (GAMCA GCC)',
            nameLocal: 'ইবনে সিনা মেডিকেল স্ক্রিনিং সেন্টার',
            city: 'Dhaka',
            address: 'Dhanmondi Road 9/A, Dhaka 1209',
            phone: '+88028113456',
            isGamca: true,
            status: 'ACTIVE',
          },
          {
            name: 'Gulf Medical Examination Center',
            nameLocal: 'গাল্ফ মেডিকেল এক্সামিনেশন সেন্টার',
            city: 'Dhaka',
            address: 'Mohakhali C/A, Dhaka',
            phone: '+88029876543',
            isGamca: true,
            status: 'ACTIVE',
          },
        ],
      });

      centers = await prisma.medicalCenter.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json({ success: true, data: centers });
  } catch (error: any) {
    console.error('Error fetching medical centers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch medical centers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();

    const parsed = medicalCenterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const center = await prisma.medicalCenter.create({
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: center }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating medical center:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create medical center' },
      { status: 500 }
    );
  }
}
