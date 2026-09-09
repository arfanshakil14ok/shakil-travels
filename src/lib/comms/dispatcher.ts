import { PrismaClient } from '@prisma/client';
import { sendEmail } from './email';
import { sendSMS } from './sms';
import { sendWhatsApp } from './whatsapp';

export interface DispatchNotificationOptions {
  applicantId?: string;
  customerId?: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  templateCode?: string;
  subject?: string;
  message: string;
  variables?: Record<string, string>;
  link?: string;
}

/**
 * Dispatches multi-channel communication, interpolates templates, and records audit logs
 */
export async function dispatchCommunication(
  prisma: PrismaClient,
  options: DispatchNotificationOptions
): Promise<{ success: boolean; logId: string; error?: string }> {
  let finalMessage = options.message;
  let finalSubject = options.subject || 'SHAKIL GLOBAL MANPOWER Notification';

  // 1. If templateCode provided, resolve and interpolate
  if (options.templateCode) {
    const tpl = await prisma.communicationTemplate.findUnique({
      where: { code: options.templateCode },
    });
    if (tpl && tpl.isActive) {
      finalMessage = tpl.content;
      if (tpl.subject) finalSubject = tpl.subject;

      if (options.variables) {
        for (const [key, val] of Object.entries(options.variables)) {
          finalMessage = finalMessage.replace(new RegExp(`{{${key}}}`, 'g'), val);
          finalSubject = finalSubject.replace(new RegExp(`{{${key}}}`, 'g'), val);
        }
      }
    }
  }

  // 2. Candidate preferences check if applicantId provided
  if (options.applicantId) {
    const applicant = await prisma.applicant.findUnique({
      where: { id: options.applicantId },
      select: { notificationPreferences: true, phone: true, email: true, fullName: true },
    });

    if (applicant?.notificationPreferences) {
      try {
        const prefs = JSON.parse(applicant.notificationPreferences);
        if (options.channel === 'EMAIL' && prefs.email === false) {
          return { success: false, logId: '', error: 'Applicant opted out of email' };
        }
        if (options.channel === 'SMS' && prefs.sms === false) {
          return { success: false, logId: '', error: 'Applicant opted out of SMS' };
        }
        if (options.channel === 'WHATSAPP' && prefs.whatsapp === false) {
          return { success: false, logId: '', error: 'Applicant opted out of WhatsApp' };
        }
      } catch (e) {
        // ignore json parse error
      }
    }
  }

  const recipient =
    options.channel === 'EMAIL'
      ? options.recipientEmail || 'no-email@shakilglobal.com'
      : options.recipientPhone || 'no-phone';

  // 3. Dispatch through appropriate transport
  let dispatchSuccess = false;
  let providerMsgId: string | undefined;
  let failureReason: string | undefined;

  try {
    if (options.channel === 'IN_APP') {
      if (options.applicantId) {
        await prisma.notification.create({
          data: {
            applicantId: options.applicantId,
            type: 'COMMUNICATION',
            title: finalSubject,
            message: finalMessage,
            link: options.link || null,
          },
        });
      }
      dispatchSuccess = true;
      providerMsgId = `notif_${Date.now()}`;
    } else if (options.channel === 'EMAIL') {
      const res = await sendEmail({
        to: recipient,
        subject: finalSubject,
        html: `<div style="font-family:sans-serif;line-height:1.6;color:#1e293b;">
          <h2>${finalSubject}</h2>
          <p>${finalMessage.replace(/\n/g, '<br/>')}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
          <small style="color:#64748b;">SHAKIL GLOBAL MANPOWER — Licensed Overseas Employment Platform (RL-1892)</small>
        </div>`,
        text: finalMessage,
      });
      dispatchSuccess = res.success;
      providerMsgId = res.messageId;
      failureReason = res.error;
    } else if (options.channel === 'SMS') {
      const res = await sendSMS({
        to: recipient,
        text: finalMessage,
      });
      dispatchSuccess = res.success;
      providerMsgId = res.messageId;
      failureReason = res.error;
    } else if (options.channel === 'WHATSAPP') {
      const res = await sendWhatsApp({
        to: recipient,
        text: finalMessage,
      });
      dispatchSuccess = res.success;
      providerMsgId = res.messageId;
      failureReason = res.error;
    }
  } catch (err: any) {
    dispatchSuccess = false;
    failureReason = err.message;
  }

  // 4. Record to CommunicationLog
  const log = await prisma.communicationLog.create({
    data: {
      applicantId: options.applicantId || null,
      customerId: options.customerId || null,
      channel: options.channel,
      recipient,
      subject: finalSubject,
      message: finalMessage,
      status: dispatchSuccess ? 'SENT' : 'FAILED',
      providerMessageId: providerMsgId || null,
      failureReason: failureReason || null,
    },
  });

  return {
    success: dispatchSuccess,
    logId: log.id,
    error: failureReason,
  };
}
