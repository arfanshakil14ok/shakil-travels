import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { applicantSchema } from '@/lib/validations/applicant';
import { generateFormattedId } from '@/lib/id-generator';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('APPLICANT_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');
    const countryId = searchParams.get('countryId');
    const categoryId = searchParams.get('categoryId');
    const education = searchParams.get('education');
    const experienceMin = searchParams.get('experienceMin');
    const assignedStaffId = searchParams.get('assignedStaffId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { applicantNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { passportNumber: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (countryId && countryId !== 'ALL') {
      where.preferredCountryId = countryId;
    }

    if (categoryId && categoryId !== 'ALL') {
      where.preferredJobCategoryId = categoryId;
    }

    if (education && education !== 'ALL') {
      where.education = education;
    }

    if (experienceMin && !isNaN(Number(experienceMin))) {
      where.yearsOfExperience = { gte: parseInt(experienceMin, 10) };
    }

    if (assignedStaffId && assignedStaffId !== 'ALL') {
      where.assignedStaffId = assignedStaffId;
    }

    const [total, items] = await Promise.all([
      prisma.applicant.count({ where }),
      prisma.applicant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          preferredCountry: { select: { id: true, name: true, flag: true, code: true } },
          preferredJobCategory: { select: { id: true, name: true, icon: true } },
          assignedStaff: { select: { id: true, name: true, email: true } },
          customer: { select: { id: true, customerType: true } },
          _count: {
            select: { notes: true, documents: true, applications: true },
          },
        },
      }),
    ]);

    const sanitizedItems = items.map((item) => {
      const { passwordHash: _, ...safeItem } = item as any;
      return safeItem;
    });

    return NextResponse.json({
      success: true,
      data: {
        items: sanitizedItems,
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
    console.error('Error fetching applicants:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch applicants' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('APPLICANT_CREATE');
    const body = await request.json();

    const parsed = applicantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check duplicate phone
    const existingPhone = await prisma.applicant.findFirst({
      where: { phone: data.phone },
    });
    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: 'An applicant with this phone number already exists' },
        { status: 409 }
      );
    }

    // Generate unique sequential business ID: SGR-2026-XXXXXX
    const applicantNumber = await generateFormattedId(prisma, 'applicant');

    const applicant = await prisma.$transaction(async (tx) => {
      const createdApplicant = await tx.applicant.create({
        data: {
          applicantNumber,
          fullName: data.fullName,
          fatherName: data.fatherName || null,
          motherName: data.motherName || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender || null,
          nationality: data.nationality || 'Bangladeshi',
          phone: data.phone,
          email: data.email || null,
          district: data.district || null,
          upazila: data.upazila || null,
          address: data.address || null,
          education: data.education || null,
          profession: data.profession || null,
          yearsOfExperience: data.yearsOfExperience,
          skills: data.skills || null,
          languages: data.languages || null,
          passportAvailable: data.passportAvailable,
          passportNumber: data.passportNumber || null,
          passportExpiry: data.passportExpiry ? new Date(data.passportExpiry) : null,
          preferredCountryId: data.preferredCountryId || null,
          preferredJobCategoryId: data.preferredJobCategoryId || null,
          status: data.status,
          source: data.source,
          assignedStaffId: data.assignedStaffId || null,
          profilePhoto: data.profilePhoto || null,
        },
        include: {
          preferredCountry: true,
          preferredJobCategory: true,
          assignedStaff: { select: { id: true, name: true, email: true } },
        },
      });

      // Synchronize CRM Customer representation
      await tx.customer.create({
        data: {
          customerType: 'APPLICANT',
          name: data.fullName,
          phone: data.phone,
          email: data.email || null,
          applicantId: createdApplicant.id,
        },
      });

      return createdApplicant;
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'APPLICANT_CREATE',
      entity: 'Applicant',
      entityId: applicant.id,
      newValue: { applicantNumber: applicant.applicantNumber, fullName: applicant.fullName },
    });

    const { passwordHash: _, ...safeApplicant } = applicant as any;
    return NextResponse.json({ success: true, data: safeApplicant }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating applicant:', error);
    return NextResponse.json({ success: false, error: 'Failed to create applicant' }, { status: 500 });
  }
}
