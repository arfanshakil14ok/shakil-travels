import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApplicantAuth } from '@/lib/portal-auth';

export async function GET() {
  try {
    const applicant = await requireApplicantAuth();

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { applicantId: applicant.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: { applicantId: applicant.id, isRead: false },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal notifications error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const applicant = await requireApplicantAuth();
    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: { applicantId: applicant.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      const notif = await prisma.notification.findUnique({
        where: { id: notificationId },
      });
      if (!notif || notif.applicantId !== applicant.id) {
        return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ success: false, error: 'Provide notificationId or markAllAsRead=true' }, { status: 400 });
  } catch (error: any) {
    if (error.message?.includes('Unauthenticated')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to update notification' }, { status: 500 });
  }
}
