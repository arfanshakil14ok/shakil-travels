import { PrismaClient } from '@prisma/client';

export type NotificationType =
  | 'APPLICATION_UPDATE'
  | 'DOCUMENT_UPDATE'
  | 'INTERVIEW'
  | 'INVOICE'
  | 'PAYMENT'
  | 'VISA'
  | 'SYSTEM';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

export async function createNotification(prisma: PrismaClient, params: CreateNotificationParams) {
  return await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

export async function getUserNotifications(
  prisma: PrismaClient,
  userId: string,
  limit = 10,
  unreadOnly = false
) {
  return await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function markNotificationAsRead(prisma: PrismaClient, id: string, userId: string) {
  return await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsAsRead(prisma: PrismaClient, userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
