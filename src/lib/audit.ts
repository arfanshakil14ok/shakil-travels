import prisma from './prisma';
import { sanitizeData } from './utils';
import { headers } from 'next/headers';

export interface AuditLogInput {
  userId?: string | null;
  actorUserId?: string | null;
  actorType?: 'STAFF' | 'APPLICANT' | 'SYSTEM' | string;
  targetUserId?: string | null;
  applicantId?: string | null;
  action: string;
  entity: string;
  entityType?: string | null;
  entityId?: string | null;
  description?: string | null;
  metadata?: any;
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

    const sanitizedMetadata = params.metadata
      ? typeof params.metadata === 'object'
        ? JSON.stringify(sanitizeData(params.metadata))
        : String(params.metadata)
      : null;

    const actorId = params.actorUserId || params.userId || null;
    const actorType = params.actorType || (params.applicantId && !params.userId ? 'APPLICANT' : 'STAFF');

    return await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        actorUserId: actorId,
        actorType,
        targetUserId: params.targetUserId || null,
        applicantId: params.applicantId || null,
        action: params.action,
        entity: params.entity,
        entityType: params.entityType || params.entity,
        entityId: params.entityId || null,
        description: params.description || null,
        metadata: sanitizedMetadata,
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
