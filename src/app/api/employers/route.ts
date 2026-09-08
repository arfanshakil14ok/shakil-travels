import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { employerSchema } from '@/lib/validations/employer';
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

    const where: any = {};
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (countryId && countryId !== 'ALL') where.countryId = countryId;
    if (verificationStatus && verificationStatus !== 'ALL') where.verificationStatus = verificationStatus;

    const [total, items] = await Promise.all([
      prisma.employer.count({ where }),
      prisma.employer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          country: true,
          _count: {
            select: { jobs: true },
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

    const employer = await prisma.$transaction(async (tx) => {
      const emp = await tx.employer.create({
        data: {
          companyName: data.companyName,
          countryId: data.countryId || null,
          industry: data.industry || null,
          contactPerson: data.contactPerson || null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          website: data.website || null,
          verificationStatus: data.verificationStatus,
          notes: data.notes || null,
        },
        include: { country: true },
      });

      // Synchronize CRM Customer profile
      await tx.customer.create({
        data: {
          customerType: 'EMPLOYER',
          name: data.companyName,
          phone: data.phone || null,
          email: data.email || null,
          employerId: emp.id,
        },
      });

      return emp;
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'EMPLOYER_CREATE',
      entity: 'Employer',
      entityId: employer.id,
      newValue: { companyName: employer.companyName, verificationStatus: employer.verificationStatus },
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
