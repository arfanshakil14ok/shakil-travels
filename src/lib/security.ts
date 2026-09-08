/**
 * Enterprise Security Hardening & Input Sanitization
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
 * Validates that the requested entity belongs to the current applicant
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
