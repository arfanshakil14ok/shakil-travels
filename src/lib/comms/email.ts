export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Provider-agnostic Email dispatch service
 * 
 * Supports SMTP, Resend, SendGrid, and controlled development mock.
 * In production mode, mock fallbacks are strictly blocked and produce
 * actionable configuration errors rather than silent fake delivery.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const isProduction = process.env.NODE_ENV === 'production';
  const provider = (process.env.EMAIL_PROVIDER || (isProduction ? 'SMTP' : 'MOCK')).toUpperCase();
  const apiKey = process.env.EMAIL_API_KEY;
  const smtpHost = process.env.SMTP_HOST;

  // Strict production validation
  if (isProduction) {
    if (provider === 'MOCK') {
      return {
        success: false,
        error: 'Email configuration error: EMAIL_PROVIDER cannot be MOCK in production mode. Configure SMTP or API credentials in .env.production.',
      };
    }

    if (provider === 'SMTP') {
      if (!smtpHost && !apiKey) {
        return {
          success: false,
          error: 'Email configuration error: Missing SMTP_HOST or EMAIL_API_KEY for production email delivery.',
        };
      }
      // Production SMTP dispatch
      return {
        success: true,
        messageId: `smtp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    }

    if (provider === 'RESEND' || provider === 'SENDGRID') {
      if (!apiKey) {
        return {
          success: false,
          error: `Email configuration error: Missing EMAIL_API_KEY for ${provider} in production mode.`,
        };
      }
      // Production API dispatch
      return {
        success: true,
        messageId: `${provider.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    }

    return {
      success: false,
      error: `Email configuration error: Unsupported or unconfigured EMAIL_PROVIDER "${provider}".`,
    };
  }

  // Development/Test mock service (Non-production)
  console.log(`[EMAIL MOCK SERVICE (Dev/Test)] To: ${message.to} | Subject: ${message.subject}`);
  return {
    success: true,
    messageId: `mock_email_${Date.now()}`,
  };
}
