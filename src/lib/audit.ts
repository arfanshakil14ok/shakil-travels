import prisma from './prisma';
import { sanitizeData } from './utils';
import { headers } from 'next/headers';

export interface AuditLogInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createAuditLog(params: AuditLogInput) {
  try {
    let ip = params.ipAddress;
    let ua = params.userAgent;

    if (!ip || !ua) {
      try {
        const headerStore = await headers();
        if (!ip) {
          ip =
            headerStore.get('x-forwarded-for')?.split(',')[0].trim() ||
            headerStore.get('x-real-ip') ||
            '127.0.0.1';
        }
        if (!ua) {
          ua = headerStore.get('user-agent') || 'Internal System';
        }
      } catch (err) {
        // Headers might not be accessible outside Next.js request context
      }
    }

    const sanitizedOld = params.oldValue
      ? JSON.stringify(typeof params.oldValue === 'object' ? sanitizeData(params.oldValue) : params.oldValue)
      : null;

    const sanitizedNew = params.newValue
      ? JSON.stringify(typeof params.newValue === 'object' ? sanitizeData(params.newValue) : params.newValue)
      : null;

    return await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        ipAddress: ip || '127.0.0.1',
        userAgent: ua ? ua.slice(0, 500) : null,
        oldValue: sanitizedOld,
        newValue: sanitizedNew,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
