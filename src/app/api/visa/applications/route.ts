import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { generateVisaApplicationNumber } from '@/lib/id-generator';
import { createVisaApplicationSchema } from '@/lib/validations/visa';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('VISA_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const countryId = searchParams.get('countryId') || '';
    const visaType = searchParams.get('visaType') || '';
    const assignedStaffId = searchParams.get('assignedStaffId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    if (search) {
      where.OR = [
        { visaApplicationNumber: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { applicant: { fullName: { contains: search, mode: 'insensitive' } } },
        { applicant: { applicantNumber: { contains: search, mode: 'insensitive' } } },
        { applicant: { passportNumber: { contains: search, mode: 'insensitive' } } },
        { application: { applicationCode: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (countryId && countryId !== 'ALL') {
      where.countryId = countryId;
    }

    if (visaType && visaType !== 'ALL') {
      where.visaType = visaType;
    }

    if (assignedStaffId && assignedStaffId !== 'ALL') {
      where.assignedStaffId = assignedStaffId;
    }

    const [total, items] = await Promise.all([
      prisma.visaApplication.count({ where }),
      prisma.visaApplication.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          applicant: {
            select: {
              id: true,
              applicantNumber: true,
              fullName: true,
              phone: true,
              passportNumber: true,
              passportExpiry: true,
            },
          },
          application: {
            select: {
              id: true,
              applicationCode: true,
              job: {
                select: {
                  id: true,
                  title: true,
                  jobCode: true,
                  employer: { select: { id: true, companyName: true } },
                },
              },
            },
          },
          country: {
            select: { id: true, name: true, code: true, flag: true },
          },
          assignedStaff: {
            select: { id: true, name: true, email: true },
          },
          appointments: {
            take: 1,
            orderBy: { appointmentDate: 'desc' },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching visa applications:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch visa applications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('VISA_CREATE');
    const body = await request.json();

    const parsed = createVisaApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { applicationId, assignedStaffId, referenceNumber, notes, visaType } = parsed.data;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { applicant: true, country: true, job: true },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Recruitment application not found' }, { status: 404 });
    }

    const countryId = parsed.data.countryId || application.countryId || application.job.countryId;
    if (!countryId) {
      return NextResponse.json({ success: false, error: 'Destination country is required for visa application' }, { status: 400 });
    }

    const visaApplicationNumber = await generateVisaApplicationNumber(prisma);

    const visaApp = await prisma.$transaction(async (tx) => {
      const created = await tx.visaApplication.create({
        data: {
          visaApplicationNumber,
          applicationId: application.id,
          applicantId: application.applicantId,
          countryId,
          visaType: visaType || 'WORK_VISA',
          status: 'NOT_STARTED',
          referenceNumber: referenceNumber || null,
          notes: notes || null,
          assignedStaffId: assignedStaffId || null,
        },
        include: {
          applicant: { select: { id: true, fullName: true, applicantNumber: true } },
          country: { select: { id: true, name: true, code: true } },
          application: { select: { id: true, applicationCode: true } },
        },
      });

      await tx.visaStatusHistory.create({
        data: {
          visaApplicationId: created.id,
          oldStatus: null,
          newStatus: 'NOT_STARTED',
          changedById: currentUser.id,
          reason: 'Initial Visa Case Creation',
          notes: notes || null,
        },
      });

      return created;
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'VISA_CREATE',
      entity: 'VISA_APPLICATION',
      entityId: visaApp.id,
      newValue: {
        visaApplicationNumber: visaApp.visaApplicationNumber,
        applicantId: visaApp.applicantId,
        applicationId: visaApp.applicationId,
        countryId: visaApp.countryId,
        visaType: visaApp.visaType,
      },
    });

    return NextResponse.json({
      success: true,
      data: visaApp,
      message: `Visa case ${visaApp.visaApplicationNumber} created successfully`,
    }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating visa application:', error);
    return NextResponse.json({ success: false, error: 'Failed to create visa application' }, { status: 500 });
  }
}
