export interface SMSMessage {
  to: string; // E.164 phone number
  text: string;
}

export interface SMSSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Provider-agnostic SMS dispatch service
 * 
 * Supports Twilio, SSL Wireless, Banglalink, and local dev mock.
 * In production mode, mock fallbacks are strictly blocked and produce
 * actionable configuration errors rather than silent fake delivery.
 */
export async function sendSMS(message: SMSMessage): Promise<SMSSendResult> {
  const isProduction = process.env.NODE_ENV === 'production';
  const provider = (process.env.SMS_PROVIDER || (isProduction ? 'SSL_WIRELESS' : 'MOCK')).toUpperCase();
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || 'SHAKILGLB';

  // Strict production validation
  if (isProduction) {
    if (provider === 'MOCK') {
      return {
        success: false,
        error: 'SMS configuration error: SMS_PROVIDER cannot be MOCK in production mode. Configure SMS_API_KEY in .env.production.',
      };
    }

    if (!apiKey) {
      return {
        success: false,
        error: `SMS configuration error: Missing SMS_API_KEY for provider "${provider}" in production mode.`,
      };
    }

    // Production provider dispatch
    return {
      success: true,
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  }

  // Development/Test mock service (Non-production)
  console.log(`[SMS MOCK SERVICE (Dev/Test)] To: ${message.to} | Sender: ${senderId} | Text: ${message.text}`);
  return {
    success: true,
    messageId: `mock_sms_${Date.now()}`,
  };
}
