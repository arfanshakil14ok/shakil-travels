import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';

export async function GET(request: NextRequest) {
  try {
    const applicant = await requireApplicantAuth();

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const rawLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { applicantId: applicant.id },
          { actorUserId: applicant.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        entity: true,
        entityType: true,
        description: true,
        actorType: true,
        createdAt: true,
        metadata: true,
      },
    });

    // Sanitize and humanize logs for candidate portal presentation
    const activities = rawLogs.map((log) => {
      let parsedMetadata: any = null;
      if (log.metadata) {
        try {
          parsedMetadata = JSON.parse(log.metadata);
        } catch {
          parsedMetadata = null;
        }
      }

      return {
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityType: log.entityType,
        description: log.description || log.action.replace(/_/g, ' '),
        actorType: log.actorType || 'STAFF',
        createdAt: log.createdAt,
        metadata: parsedMetadata ? {
          fileName: parsedMetadata.fileName,
          documentType: parsedMetadata.documentType,
          status: parsedMetadata.status,
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: activities,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Candidate activity fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
