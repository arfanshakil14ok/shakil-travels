import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import { dispatchCommunication } from '@/lib/comms/dispatcher';

export async function POST(request: NextRequest) {
  try {
    await requirePermission('COMMUNICATION_SEND');

    const body = await request.json();
    const { logId, allFailed } = body;

    if (!logId && !allFailed) {
      return NextResponse.json(
        { success: false, error: 'Provide either logId or allFailed=true' },
        { status: 400 }
      );
    }

    let logsToRetry: any[] = [];

    if (logId) {
      const log = await prisma.communicationLog.findUnique({
        where: { id: logId },
      });
      if (!log) {
        return NextResponse.json({ success: false, error: 'Log entry not found' }, { status: 404 });
      }
      logsToRetry = [log];
    } else if (allFailed) {
      logsToRetry = await prisma.communicationLog.findMany({
        where: {
          status: 'FAILED',
          retryCount: { lt: 5 },
        },
        take: 50,
      });
    }

    const results: any[] = [];

    for (const log of logsToRetry) {
      const retryResult = await dispatchCommunication(prisma, {
        applicantId: log.applicantId || undefined,
        customerId: log.customerId || undefined,
        recipientEmail: log.channel === 'EMAIL' ? log.recipient : undefined,
        recipientPhone: ['SMS', 'WHATSAPP'].includes(log.channel) ? log.recipient : undefined,
        channel: log.channel as any,
        subject: log.subject || undefined,
        message: log.message,
      });

      // Update old log retry count
      await prisma.communicationLog.update({
        where: { id: log.id },
        data: {
          retryCount: { increment: 1 },
          status: retryResult.success ? 'RETRY_SUCCEEDED' : 'FAILED',
          failureReason: retryResult.error || null,
        },
      });

      results.push({
        originalLogId: log.id,
        channel: log.channel,
        recipient: log.recipient,
        success: retryResult.success,
        error: retryResult.error,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Retried ${results.length} communication(s)`,
      data: results,
    });
  } catch (error: any) {
    if (error.name === 'AuthorizationError' || error.name === 'AuthenticationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Error retrying communication:', error);
    return NextResponse.json({ success: false, error: 'Failed to retry communications' }, { status: 500 });
  }
}
