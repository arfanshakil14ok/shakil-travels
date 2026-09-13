import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { employerSchema } from '@/lib/validations/employer';
import { generateEmployerCode } from '@/lib/id-generator';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('EMPLOYER_VIEW');
    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search')?.trim();
    const countryId = searchParams.get('countryId');
    const verificationStatus = searchParams.get('verificationStatus');
    const status = searchParams.get('status');

    const where: any = {};
    if (search) {
      where.OR = [
        { employerCode: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { companyNameLocal: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (countryId && countryId !== 'ALL') where.countryId = countryId;
    if (verificationStatus && verificationStatus !== 'ALL') where.verificationStatus = verificationStatus;
    if (status && status !== 'ALL') where.status = status;

    const [total, items] = await Promise.all([
      prisma.employer.count({ where }),
      prisma.employer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          country: true,
          contacts: {
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          },
          jobs: {
            select: {
              id: true,
              status: true,
              vacancyCount: true,
              filledCount: true,
            },
          },
          _count: {
            select: { jobs: true, contacts: true, documents: true },
          },
        },
      }),
    ]);

    const formatted = items.map((emp) => {
      const activeJobs = emp.jobs.filter((j) => j.status === 'PUBLISHED').length;
      const totalVacancies = emp.jobs.reduce((sum, j) => sum + (j.vacancyCount || 0), 0);
      const remainingVacancies = emp.jobs.reduce(
        (sum, j) => sum + Math.max(0, (j.vacancyCount || 0) - (j.filledCount || 0)),
        0
      );
      return {
        ...emp,
        activeJobs,
        totalVacancies,
        remainingVacancies,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: formatted,
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
    console.error('Error fetching employers:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch employers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('EMPLOYER_CREATE');
    const body = await request.json();

    const parsed = employerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Duplicate employer prevention: check companyName (case-insensitive) + countryId or email
    const duplicateWhere: any[] = [
      {
        companyName: { equals: data.companyName.trim(), mode: 'insensitive' },
        ...(data.countryId ? { countryId: data.countryId } : {}),
      },
    ];
    if (data.email && data.email.trim()) {
      duplicateWhere.push({ email: { equals: data.email.trim(), mode: 'insensitive' } });
    }

    const existingEmployer = await prisma.employer.findFirst({
      where: { OR: duplicateWhere },
    });

    if (existingEmployer) {
      return NextResponse.json(
        {
          success: false,
          error: `An employer with this company name or email already exists (${existingEmployer.employerCode || existingEmployer.companyName}). Duplicate employer prevented.`,
          errorBn: `এই কোম্পানি নাম বা ইমেইল দিয়ে আগেই নিয়োগকর্তা তৈরি রয়েছে (${existingEmployer.employerCode || existingEmployer.companyName})।`,
          existingEmployer: {
            id: existingEmployer.id,
            employerCode: existingEmployer.employerCode,
            companyName: existingEmployer.companyName,
          },
        },
        { status: 409 }
      );
    }

    const employer = await prisma.$transaction(async (tx) => {
      const employerCode = await generateEmployerCode(tx as any);

      const emp = await tx.employer.create({
        data: {
          employerCode,
          companyName: data.companyName.trim(),
          companyNameLocal: data.companyNameLocal?.trim() || null,
          countryId: data.countryId || null,
          city: data.city?.trim() || null,
          industry: data.industry?.trim() || null,
          contactPerson: data.contactPerson?.trim() || null,
          email: data.email?.trim().toLowerCase() || null,
          phone: data.phone?.trim() || null,
          address: data.address?.trim() || null,
          website: data.website?.trim() || null,
          verificationStatus: data.verificationStatus || 'PENDING',
          status: data.status || 'ACTIVE',
          notes: data.notes?.trim() || null,
        },
        include: { country: true },
      });

      // Synchronize CRM Customer profile
      await tx.customer.create({
        data: {
          customerType: 'EMPLOYER',
          name: data.companyName.trim(),
          phone: data.phone?.trim() || null,
          email: data.email?.trim().toLowerCase() || null,
          employerId: emp.id,
        },
      });

      // If contact person provided, create default primary EmployerContact
      if (data.contactPerson && data.contactPerson.trim()) {
        await tx.employerContact.create({
          data: {
            employerId: emp.id,
            name: data.contactPerson.trim(),
            email: data.email?.trim().toLowerCase() || null,
            phone: data.phone?.trim() || null,
            isPrimary: true,
          },
        });
      }

      return emp;
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'EMPLOYER_CREATE',
      entity: 'Employer',
      entityId: employer.id,
      newValue: {
        employerCode: employer.employerCode,
        companyName: employer.companyName,
        verificationStatus: employer.verificationStatus,
        status: employer.status,
      },
    });

    return NextResponse.json({ success: true, data: employer }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating employer:', error);
    return NextResponse.json({ success: false, error: 'Failed to create employer' }, { status: 500 });
  }
}
