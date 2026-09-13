import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { visaSubmitSchema } from '@/lib/validations/processing';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      select: { id: true },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    const visaCase = await prisma.visaCase.findUnique({
      where: { processingCaseId: pc.id },
      include: {
        visaDocument: true,
      },
    });

    return NextResponse.json({ success: true, data: visaCase });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error fetching visa case:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch visa case' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const parsed = visaSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { country, visaType, applicationNumber, sponsorName, sponsorReference, notes } = parsed.data;

    const pc = await prisma.recruitmentProcessingCase.findFirst({
      where: { OR: [{ id }, { processingCode: id }] },
      include: { job: { include: { country: true } }, employer: true },
    });

    if (!pc) {
      return NextResponse.json({ success: false, error: 'Processing case not found' }, { status: 404 });
    }

    const visaCountry = country || pc.job?.country?.name || 'Saudi Arabia';
    const visaSponsor = sponsorName || pc.employer?.companyName || null;

    const visaCase = await prisma.visaCase.upsert({
      where: { processingCaseId: pc.id },
      create: {
        processingCaseId: pc.id,
        candidateId: pc.applicantId,
        country: visaCountry,
        visaType: visaType || 'EMPLOYMENT_VISA',
        applicationNumber: applicationNumber || null,
        sponsorName: visaSponsor,
        sponsorReference: sponsorReference || null,
        status: 'PREPARATION',
        notes: notes || null,
      },
      update: {
        country: visaCountry,
        visaType: visaType || undefined,
        applicationNumber: applicationNumber || undefined,
        sponsorName: visaSponsor || undefined,
        sponsorReference: sponsorReference || undefined,
        notes: notes || undefined,
      },
    });

    await createAuditLog({
      actorId: currentUser.id,
      actorType: 'STAFF',
      action: 'CREATE',
      entity: 'VISA_CASE',
      entityId: visaCase.id,
      description: `Initialized visa file for processing case ${pc.processingCode}`,
      metadata: { processingCaseId: pc.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Visa case prepared successfully',
      data: visaCase,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error preparing visa case:', error);
    return NextResponse.json({ success: false, error: 'Failed to prepare visa case' }, { status: 500 });
  }
}
