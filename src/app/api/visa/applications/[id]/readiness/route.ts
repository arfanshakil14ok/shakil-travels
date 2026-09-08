import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { calculateDepartureReadiness } from '@/lib/visa/readiness';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('VISA_VIEW');
    const { id } = await params;

    const readiness = await calculateDepartureReadiness(prisma, id);
    if (!readiness) {
      return NextResponse.json({ success: false, error: 'Visa application not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: readiness,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error checking departure readiness:', error);
    return NextResponse.json({ success: false, error: 'Failed to evaluate departure readiness' }, { status: 500 });
  }
}
