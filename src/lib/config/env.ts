/**
 * Safe Server-Side Environment Configuration & Production Validation
 * 
 * Ensures all required secrets and endpoints are present in production,
 * prevents mock services from running silently in production,
 * and guards against secret leakage in logs or API responses.
 */

export interface EnvValidationResult {
  isValid: boolean;
  missingRequired: string[];
  warnings: string[];
  environment: string;
}

export interface SanitizedConfigSummary {
  environment: string;
  databaseConfigured: boolean;
  authSecretConfigured: boolean;
  portalSecretConfigured: boolean;
  appUrl: string;
  emailProvider: string;
  smsProvider: string;
  whatsappProvider: string;
  paymentProvider: string;
  storageProvider: string;
}

const DEFAULT_DEV_STAFF_SECRET = 'sgr_enterprise_secret_key_change_in_production_2026_recruit_auth';
const DEFAULT_DEV_PORTAL_SECRET = 'sgr_portal_secure_jwt_secret_applicant_2026';

/**
 * Validates the runtime environment against production standards
 */
export function validateProductionConfig(): EnvValidationResult {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';

  const missingRequired: string[] = [];
  const warnings: string[] = [];

  // 1. Database Connection String
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.trim() === '') {
    missingRequired.push('DATABASE_URL');
  } else if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    warnings.push('DATABASE_URL does not start with postgresql:// or postgres://');
  }

  // 2. Staff Authentication Secret
  const authSecret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
  if (!authSecret || authSecret.trim() === '') {
    missingRequired.push('AUTH_SECRET (or JWT_SECRET)');
  } else if (isProduction && authSecret === DEFAULT_DEV_STAFF_SECRET) {
    missingRequired.push('AUTH_SECRET (using default development secret in production)');
  } else if (isProduction && authSecret.length < 32) {
    warnings.push('AUTH_SECRET is shorter than 32 characters; recommend 64-char hex');
  }

  // 3. Portal Authentication Secret
  const portalSecret = process.env.PORTAL_JWT_SECRET;
  if (isProduction && (!portalSecret || portalSecret.trim() === '')) {
    missingRequired.push('PORTAL_JWT_SECRET');
  } else if (isProduction && portalSecret === DEFAULT_DEV_PORTAL_SECRET) {
    missingRequired.push('PORTAL_JWT_SECRET (using default development secret in production)');
  }

  // 4. Application URL
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (isProduction && (!appUrl || appUrl.trim() === '')) {
    missingRequired.push('APP_URL (or NEXT_PUBLIC_APP_URL)');
  }

  // 5. Communications in Production
  if (isProduction) {
    const emailProvider = (process.env.EMAIL_PROVIDER || 'MOCK').toUpperCase();
    if (emailProvider === 'MOCK') {
      warnings.push('EMAIL_PROVIDER is set to MOCK in production. Outbound emails will not reach recipients.');
    } else {
      const emailKey = process.env.EMAIL_API_KEY;
      const smtpHost = process.env.SMTP_HOST;
      if (!emailKey && !smtpHost) {
        missingRequired.push('EMAIL_API_KEY (or SMTP_HOST for configured email provider)');
      }
    }

    const smsProvider = (process.env.SMS_PROVIDER || 'MOCK').toUpperCase();
    if (smsProvider === 'MOCK') {
      warnings.push('SMS_PROVIDER is set to MOCK in production. Outbound SMS will not reach recipients.');
    } else if (!process.env.SMS_API_KEY) {
      missingRequired.push('SMS_API_KEY (for configured SMS provider)');
    }

    const waProvider = (process.env.WHATSAPP_PROVIDER || 'MOCK').toUpperCase();
    if (waProvider === 'MOCK') {
      warnings.push('WHATSAPP_PROVIDER is set to MOCK in production. WhatsApp messages will not reach recipients.');
    } else if (!process.env.WHATSAPP_API_KEY) {
      missingRequired.push('WHATSAPP_API_KEY (for configured WhatsApp provider)');
    }

    // 6. File Storage in Production
    const storageProvider = (process.env.STORAGE_PROVIDER || 'S3').toUpperCase();
    if (storageProvider === 'LOCAL') {
      const allowLocal = process.env.STORAGE_ALLOW_LOCAL_IN_PRODUCTION === 'true';
      if (!allowLocal) {
        missingRequired.push(
          'STORAGE_PROVIDER (Local disk storage cannot be primary production storage without STORAGE_ALLOW_LOCAL_IN_PRODUCTION=true. Set STORAGE_PROVIDER=S3 and configure S3 credentials)'
        );
      } else {
        warnings.push('STORAGE_ALLOW_LOCAL_IN_PRODUCTION is active. Ephemeral containers will lose uploaded files on restart.');
      }
    } else if (storageProvider === 'S3') {
      if (!process.env.STORAGE_BUCKET) missingRequired.push('STORAGE_BUCKET');
      if (!process.env.STORAGE_ACCESS_KEY) missingRequired.push('STORAGE_ACCESS_KEY');
      if (!process.env.STORAGE_SECRET_KEY) missingRequired.push('STORAGE_SECRET_KEY');
    }
  }

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    warnings,
    environment: env,
  };
}

/**
 * Throws a controlled ConfigurationError if required production variables are absent.
 * NEVER prints secret values or sensitive tokens in the error message.
 */
export function assertProductionConfig(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const result = validateProductionConfig();
  if (!result.isValid) {
    const errorMsg = `[CONFIGURATION ERROR] Missing required production environment variables: ${result.missingRequired.join(
      ', '
    )}. Please check docs/ENVIRONMENT.md for deployment setup.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Returns a sanitized configuration overview with all secrets masked
 */
export function getSanitizedConfig(): SanitizedConfigSummary {
  const authSecret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
  const portalSecret = process.env.PORTAL_JWT_SECRET;

  return {
    environment: process.env.NODE_ENV || 'development',
    databaseConfigured: !!process.env.DATABASE_URL,
    authSecretConfigured: !!authSecret && authSecret !== DEFAULT_DEV_STAFF_SECRET,
    portalSecretConfigured: !!portalSecret && portalSecret !== DEFAULT_DEV_PORTAL_SECRET,
    appUrl: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    emailProvider: process.env.EMAIL_PROVIDER || 'MOCK',
    smsProvider: process.env.SMS_PROVIDER || 'MOCK',
    whatsappProvider: process.env.WHATSAPP_PROVIDER || 'MOCK',
    paymentProvider: process.env.PAYMENT_PROVIDER || 'MANUAL',
    storageProvider: process.env.STORAGE_PROVIDER || 'LOCAL',
  };
}
