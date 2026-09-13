/**
 * Profile Photo Validation Utility
 * Validates MIME type, file size, extension, and magic bytes for image uploads.
 */

export interface PhotoValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  extension?: string;
}

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Inspect magic bytes of image buffer to prevent file extension spoofing
 */
export function verifyImageMagicBytes(buffer: Buffer): { valid: boolean; detectedType?: string } {
  if (!buffer || buffer.length < 12) {
    return { valid: false };
  }

  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedType: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedType: 'image/png' };
  }

  // WEBP: 'RIFF' .... 'WEBP'
  const riffHeader = buffer.subarray(0, 4).toString('ascii');
  const webpHeader = buffer.subarray(8, 12).toString('ascii');
  if (riffHeader === 'RIFF' && webpHeader === 'WEBP') {
    return { valid: true, detectedType: 'image/webp' };
  }

  return { valid: false };
}

/**
 * Validate a profile photo file buffer and metadata
 */
export function validateProfilePhoto(
  buffer: Buffer,
  fileName?: string,
  declaredMime?: string
): PhotoValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Profile photo file is empty or missing.' };
  }

  if (buffer.length > MAX_PHOTO_SIZE_BYTES) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Profile photo exceeds the 5MB size limit (Received: ${sizeMb}MB). Please upload a smaller image.`,
    };
  }

  const magicCheck = verifyImageMagicBytes(buffer);
  if (!magicCheck.valid || !magicCheck.detectedType) {
    return {
      valid: false,
      error: 'Invalid or unsupported image format. Please upload a real JPG, PNG, or WebP photo.',
    };
  }

  if (declaredMime) {
    const normDeclared = declaredMime.toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.includes(normDeclared)) {
      return {
        valid: false,
        error: `MIME type "${declaredMime}" is not allowed. Only JPEG, PNG, and WebP images are permitted.`,
      };
    }
  }

  if (fileName) {
    const lowerName = fileName.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExt) {
      return {
        valid: false,
        error: 'File extension is not allowed. Only .jpg, .jpeg, .png, and .webp are permitted.',
      };
    }
  }

  return {
    valid: true,
    mimeType: magicCheck.detectedType,
    extension: magicCheck.detectedType === 'image/jpeg' ? '.jpg' : magicCheck.detectedType === 'image/png' ? '.png' : '.webp',
  };
}

/**
 * Convert base64 data URL to Buffer
 */
export function parseBase64Photo(dataUrlOrBase64: string): { buffer: Buffer; mimeType: string } | null {
  try {
    if (dataUrlOrBase64.startsWith('data:')) {
      const match = dataUrlOrBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return null;
      const mimeType = match[1];
      const buffer = Buffer.from(match[2], 'base64');
      return { buffer, mimeType };
    }
    const buffer = Buffer.from(dataUrlOrBase64, 'base64');
    return { buffer, mimeType: 'image/jpeg' };
  } catch {
    return null;
  }
}
