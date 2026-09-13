/**
 * Enterprise Security Hardening & Input Sanitization
 * Shakil Global Recruitment V2.0 (RL-1892)
 */

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeFileName(name: string): string {
  // Strip null bytes and directory traversal characters
  return name
    .replace(/\0/g, '')
    .replace(/(\.\.(\/|\\|$))+/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Validates whether a redirect URL is strictly safe and local to the application.
 * Prevents open redirect attacks (e.g. //evil.com, https://phishing.com, javascript:...).
 */
export function isSafeRedirectUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('/')) return false;
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\')) return false;
  if (/[\r\n\t\0]/.test(trimmed)) return false;
  if (/^(?:https?:|javascript:|data:|vbscript:|file:)/i.test(trimmed)) return false;
  return true;
}

/**
 * Sanitizes a redirect URL, returning fallback if the URL is unsafe or external.
 */
export function sanitizeRedirectUrl(url: string | null | undefined, fallback = '/'): string {
  if (isSafeRedirectUrl(url)) {
    return url!.trim();
  }
  return fallback;
}

/**
 * Formats API errors safely to avoid leaking database schema, stack traces,
 * or raw SQL error details to external clients in production environments.
 */
export function sanitizeErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred'): string {
  if (!error) return fallbackMessage;
  if (error instanceof Error) {
    // Check for Prisma or database error indicators
    const msg = error.message;
    if (
      msg.includes('prisma') ||
      msg.includes('Unique constraint') ||
      msg.includes('Foreign key') ||
      msg.includes('database error') ||
      msg.includes('SELECT ') ||
      msg.includes('INSERT INTO') ||
      msg.includes('UPDATE ') ||
      msg.includes('DELETE FROM')
    ) {
      return fallbackMessage;
    }
    return msg;
  }
  return fallbackMessage;
}

/**
 * Validates that the requested entity belongs to the current applicant (IDOR Protection)
 */
export function assertApplicantOwnership(
  resourceApplicantId: string | null | undefined,
  currentApplicantId: string
): void {
  if (!resourceApplicantId || resourceApplicantId !== currentApplicantId) {
    const error = new Error('Access denied: You do not own this resource');
    error.name = 'AuthorizationError';
    throw error;
  }
}

