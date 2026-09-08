import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StorageMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  applicantId?: string;
  documentType?: string;
}

export interface StorageProvider {
  saveFile(subPath: string, buffer: Buffer, metadata?: StorageMetadata): Promise<string>;
  getFile(subPath: string): Promise<Buffer>;
  deleteFile(subPath: string): Promise<boolean>;
  fileExists(subPath: string): Promise<boolean>;
  getSignedDownloadUrl?(subPath: string, expiresInSeconds?: number): Promise<string>;
}

export interface S3Config {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Validates document size and allowed MIME types for compliance and security
 */
export function validateDocumentFile(
  fileSize: number,
  mimeType: string
): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the 10MB limit (Received: ${(fileSize / (1024 * 1024)).toFixed(2)}MB)`,
    };
  }

  const normalizedMime = mimeType.toLowerCase().trim();
  if (!ALLOWED_MIME_TYPES.includes(normalizedMime)) {
    return {
      valid: false,
      error: `Disallowed file format "${mimeType}". Allowed formats: PDF, JPEG, PNG, WEBP.`,
    };
  }

  return { valid: true };
}

/**
 * Local Private Storage Provider (for development and persistent VM storage)
 * Files are isolated in private disk directory outside of public web roots.
 */
export class LocalPrivateStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    const defaultDir = path.resolve(process.cwd(), process.env.STORAGE_DIR || 'uploads/private');
    this.baseDir = customBaseDir || defaultDir;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolvePath(subPath: string): string {
    const normalized = path.normalize(subPath).replace(/^(\.\.[\/\\])+/, '');
    return path.join(this.baseDir, normalized);
  }

  async saveFile(subPath: string, buffer: Buffer): Promise<string> {
    const fullPath = this.resolvePath(subPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(fullPath, buffer);
    return subPath;
  }

  async getFile(subPath: string): Promise<Buffer> {
    const fullPath = this.resolvePath(subPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Document file not found: ${subPath}`);
    }
    return await fs.promises.readFile(fullPath);
  }

  async deleteFile(subPath: string): Promise<boolean> {
    const fullPath = this.resolvePath(subPath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
    return false;
  }

  async fileExists(subPath: string): Promise<boolean> {
    const fullPath = this.resolvePath(subPath);
    return fs.existsSync(fullPath);
  }

  async getSignedDownloadUrl(subPath: string): Promise<string> {
    // Local storage streams directly through authenticated API endpoints
    return `/api/documents/stream?path=${encodeURIComponent(subPath)}`;
  }
}

/**
 * Production S3-Compatible Cloud Storage Provider
 * 
 * Supports AWS S3, Cloudflare R2, MinIO, Wasabi, and DigitalOcean Spaces
 * using standard AWS SigV4 cryptographic authentication.
 * Bucket objects are 100% private and never publicly accessible.
 */
export class S3StorageProvider implements StorageProvider {
  private config: S3Config;
  private endpoint: string;

  constructor(config: S3Config) {
    this.config = config;
    this.endpoint =
      config.endpoint || `https://s3.${config.region}.amazonaws.com`;
  }

  private getUrl(subPath: string): string {
    const cleanPath = subPath.startsWith('/') ? subPath.slice(1) : subPath;
    if (this.endpoint.includes('amazonaws.com')) {
      // Virtual hosted style for AWS
      return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${cleanPath}`;
    }
    // Path style for MinIO / custom endpoints
    return `${this.endpoint}/${this.config.bucket}/${cleanPath}`;
  }

  private getHost(): string {
    const url = new URL(this.getUrl(''));
    return url.host;
  }

  /**
   * Generates AWS Signature Version 4 Authorization Header
   */
  private sign(
    method: string,
    canonicalUri: string,
    headers: Record<string, string>,
    payloadHash: string
  ): Record<string, string> {
    const date = new Date();
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const signedHeadersList = Object.keys(headers)
      .map((k) => k.toLowerCase())
      .sort();
    const signedHeaders = signedHeadersList.join(';');

    const canonicalHeaders = signedHeadersList
      .map((k) => `${k}:${headers[k].trim()}\n`)
      .join('');

    const canonicalRequest = [
      method,
      canonicalUri,
      '', // query string
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${this.config.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    // Key derivation
    const kDate = crypto.createHmac('sha256', 'AWS4' + this.config.secretAccessKey).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(this.config.region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update('s3').digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();

    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const authorization = `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      ...headers,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      Authorization: authorization,
    };
  }

  async saveFile(subPath: string, buffer: Buffer, metadata?: StorageMetadata): Promise<string> {
    const cleanPath = subPath.startsWith('/') ? subPath.slice(1) : subPath;
    const url = this.getUrl(cleanPath);
    const host = new URL(url).host;
    const uri = new URL(url).pathname;

    const payloadHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const headers: Record<string, string> = {
      host,
      'content-type': metadata?.mimeType || 'application/octet-stream',
      'x-amz-acl': 'private',
      'x-amz-server-side-encryption': 'AES256',
    };

    const signedHeaders = this.sign('PUT', uri, headers, payloadHash);

    const response = await fetch(url, {
      method: 'PUT',
      headers: signedHeaders,
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed: HTTP ${response.status} ${response.statusText}`);
    }

    return cleanPath;
  }

  async getFile(subPath: string): Promise<Buffer> {
    const cleanPath = subPath.startsWith('/') ? subPath.slice(1) : subPath;
    const url = this.getUrl(cleanPath);
    const host = new URL(url).host;
    const uri = new URL(url).pathname;

    const payloadHash = crypto.createHash('sha256').update('').digest('hex');
    const headers: Record<string, string> = { host };
    const signedHeaders = this.sign('GET', uri, headers, payloadHash);

    const response = await fetch(url, {
      method: 'GET',
      headers: signedHeaders,
    });

    if (!response.ok) {
      throw new Error(`S3 download failed: HTTP ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async deleteFile(subPath: string): Promise<boolean> {
    const cleanPath = subPath.startsWith('/') ? subPath.slice(1) : subPath;
    const url = this.getUrl(cleanPath);
    const host = new URL(url).host;
    const uri = new URL(url).pathname;

    const payloadHash = crypto.createHash('sha256').update('').digest('hex');
    const headers: Record<string, string> = { host };
    const signedHeaders = this.sign('DELETE', uri, headers, payloadHash);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: signedHeaders,
    });

    return response.ok || response.status === 204;
  }

  async fileExists(subPath: string): Promise<boolean> {
    const cleanPath = subPath.startsWith('/') ? subPath.slice(1) : subPath;
    const url = this.getUrl(cleanPath);
    const host = new URL(url).host;
    const uri = new URL(url).pathname;

    const payloadHash = crypto.createHash('sha256').update('').digest('hex');
    const headers: Record<string, string> = { host };
    const signedHeaders = this.sign('HEAD', uri, headers, payloadHash);

    const response = await fetch(url, {
      method: 'HEAD',
      headers: signedHeaders,
    });

    return response.ok;
  }

  async getSignedDownloadUrl(subPath: string, expiresInSeconds = 300): Promise<string> {
    const cleanPath = subPath.startsWith('/') ? subPath.slice(1) : subPath;
    const urlStr = this.getUrl(cleanPath);
    const parsed = new URL(urlStr);
    const host = parsed.host;
    const uri = parsed.pathname;

    const date = new Date();
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const credentialScope = `${dateStamp}/${this.config.region}/s3/aws4_request`;

    const queryParams: Record<string, string> = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${this.config.accessKeyId}/${credentialScope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': expiresInSeconds.toString(),
      'X-Amz-SignedHeaders': 'host',
    };

    const canonicalQueryString = Object.keys(queryParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
      .join('&');

    const canonicalRequest = [
      'GET',
      uri,
      canonicalQueryString,
      `host:${host}\n`,
      'host',
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const kDate = crypto.createHmac('sha256', 'AWS4' + this.config.secretAccessKey).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(this.config.region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update('s3').digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();

    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    return `${urlStr}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
  }
}

/**
 * Storage Provider Factory
 * In production: Enforces S3-compatible cloud storage with explicit credential validation.
 * In development: Uses LocalPrivateStorageProvider by default.
 */
export function createStorageProvider(): StorageProvider {
  const isProduction = process.env.NODE_ENV === 'production';
  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.npm_lifecycle_event === 'build';

  if (isBuildPhase) {
    return new LocalPrivateStorageProvider();
  }

  const providerType = (process.env.STORAGE_PROVIDER || (isProduction ? 'S3' : 'LOCAL')).toUpperCase();

  if (isProduction) {
    if (providerType === 'LOCAL') {
      const allowLocal = process.env.STORAGE_ALLOW_LOCAL_IN_PRODUCTION === 'true';
      if (!allowLocal) {
        throw new Error(
          'Storage configuration error: Local disk storage cannot be used as primary production storage without STORAGE_ALLOW_LOCAL_IN_PRODUCTION=true. Configure S3 storage credentials in .env.production.'
        );
      }
      return new LocalPrivateStorageProvider();
    }

    if (providerType === 'S3') {
      const bucket = process.env.STORAGE_BUCKET;
      const accessKeyId = process.env.STORAGE_ACCESS_KEY;
      const secretAccessKey = process.env.STORAGE_SECRET_KEY;
      const region = process.env.STORAGE_REGION || 'us-east-1';
      const endpoint = process.env.STORAGE_ENDPOINT;

      if (!bucket || !accessKeyId || !secretAccessKey) {
        throw new Error(
          'Storage configuration error: Missing required production S3 credentials (STORAGE_BUCKET, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY). Check docs/ENVIRONMENT.md.'
        );
      }

      return new S3StorageProvider({
        bucket,
        accessKeyId,
        secretAccessKey,
        region,
        endpoint,
      });
    }
  }

  // Development/Testing fallback
  if (providerType === 'S3' && process.env.STORAGE_BUCKET && process.env.STORAGE_ACCESS_KEY && process.env.STORAGE_SECRET_KEY) {
    return new S3StorageProvider({
      bucket: process.env.STORAGE_BUCKET,
      accessKeyId: process.env.STORAGE_ACCESS_KEY,
      secretAccessKey: process.env.STORAGE_SECRET_KEY,
      region: process.env.STORAGE_REGION || 'us-east-1',
      endpoint: process.env.STORAGE_ENDPOINT,
    });
  }

  return new LocalPrivateStorageProvider();
}

// Lazy singleton instance to prevent build-time crashes before environment is loaded
let _activeStorage: StorageProvider | null = null;
function getActiveStorage(): StorageProvider {
  if (!_activeStorage) {
    _activeStorage = createStorageProvider();
  }
  return _activeStorage;
}

export const storage: StorageProvider = {
  saveFile: (subPath, buffer, metadata) => getActiveStorage().saveFile(subPath, buffer, metadata),
  getFile: (subPath) => getActiveStorage().getFile(subPath),
  deleteFile: (subPath) => getActiveStorage().deleteFile(subPath),
  fileExists: (subPath) => getActiveStorage().fileExists(subPath),
  getSignedDownloadUrl: (subPath, expires) =>
    getActiveStorage().getSignedDownloadUrl
      ? getActiveStorage().getSignedDownloadUrl!(subPath, expires)
      : Promise.resolve(''),
};
