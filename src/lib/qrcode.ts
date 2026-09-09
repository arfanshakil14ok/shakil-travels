import QRCode from 'qrcode';

/**
 * Generates a crisp data URL (base64 PNG) for a given text or URL
 */
export async function generateQrDataUrl(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 256,
      margin: options?.margin ?? 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: options?.color?.dark || '#091e42',
        light: options?.color?.light || '#ffffff',
      },
    });
  } catch (error) {
    console.error('Failed to generate QR Code data URL:', error);
    throw error;
  }
}

/**
 * Generates an SVG string for a given text or URL
 */
export async function generateQrSvg(
  text: string,
  options?: {
    width?: number;
    margin?: number;
  }
): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      width: options?.width || 256,
      margin: options?.margin ?? 1,
      errorCorrectionLevel: 'M',
    });
  } catch (error) {
    console.error('Failed to generate QR Code SVG:', error);
    throw error;
  }
}

/**
 * Resolves the public base URL for invoice verification
 */
export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

/**
 * Constructs the canonical public verification URL for an invoice
 */
export function getInvoiceVerificationUrl(invoiceNumber: string): string {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/invoice/verify/${encodeURIComponent(invoiceNumber)}`;
}
