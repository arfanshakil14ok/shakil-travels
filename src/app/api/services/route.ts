import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { serviceSchema } from '@/lib/validations/accounting';
import { createAuditLog } from '@/lib/audit';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('INVOICE_VIEW');

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search')?.trim();

    const where: any = {};
    if (isActive !== null && isActive !== undefined && isActive !== 'ALL') {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.OR = [
        { serviceCode: { contains: search, mode: 'insensitive' } },
        { serviceName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: { serviceCode: 'asc' },
      include: {
        _count: { select: { invoiceItems: true } },
      },
    });

    return NextResponse.json({ success: true, data: services });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching services:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requirePermission('INVOICE_CREATE');
    const body = await request.json();

    const parsed = serviceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existing = await prisma.service.findUnique({
      where: { serviceCode: data.code },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Service with code "${data.code}" already exists.` },
        { status: 409 }
      );
    }

    const service = await prisma.service.create({
      data: {
        serviceCode: data.code,
        serviceName: data.name,
        description: data.description || null,
        defaultPrice: new Prisma.Decimal(data.defaultAmount.toFixed(2)),
        currency: data.currency || 'BDT',
        taxRate: new Prisma.Decimal(data.taxRate ? data.taxRate.toFixed(2) : '0'),
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: 'SERVICE_CREATE',
      entity: 'SERVICE',
      entityId: service.id,
      newValue: service,
    });

    return NextResponse.json(
      {
        success: true,
        data: service,
        message: `Service "${service.serviceName}" created successfully`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error creating service:', error);
    return NextResponse.json({ success: false, error: 'Failed to create service' }, { status: 500 });
  }
}
