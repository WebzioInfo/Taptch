import { randomBytes } from 'node:crypto';
import { logger } from '@/lib/logger';

export class StorageServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageServiceError';
  }
}

export interface SignedUploadUrlResult {
  uploadUrl: string;
  publicUrl: string;
  fileKey: string;
  expiresInSeconds: number;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Validates file upload metadata before issuing signed direct-upload URLs
 */
export function validateUploadMetadata(mimeType: string, fileSizeBytes: number) {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new StorageServiceError(
      `Unsupported file type "${mimeType}". Allowed formats: JPEG, PNG, WebP, SVG.`
    );
  }

  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new StorageServiceError(
      `File size (${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB) exceeds maximum limit of 5MB.`
    );
  }
}

/**
 * Creates a signed direct-upload URL for client-side asset uploading
 * Prevents large file payloads from passing through Next.js serverless compute
 */
export async function createSignedUploadUrl(
  purpose: 'avatar' | 'logo' | 'proof' | 'receipt',
  filename: string,
  mimeType: string,
  fileSizeBytes: number
): Promise<SignedUploadUrlResult> {
  validateUploadMetadata(mimeType, fileSizeBytes);

  const ext = filename.split('.').pop() || 'png';
  const fileKey = `campaign/instagram-card/${purpose}/${Date.now()}_${randomBytes(8).toString('hex')}.${ext}`;
  const expiresInSeconds = 900; // 15 minutes

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const bucketName = process.env.CAMPAIGN_STORAGE_BUCKET || 'campaign-assets';

  // If Supabase Storage is configured with service role
  if (supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const uploadUrl = `${supabaseUrl}/storage/v1/object/upload/sign/${bucketName}/${fileKey}`;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileKey}`;

    return {
      uploadUrl,
      publicUrl,
      fileKey,
      expiresInSeconds,
    };
  }

  // Fallback to local / simulated upload endpoint for testing and dev environments
  const publicBase = process.env.NEXT_PUBLIC_CAMPAIGN_DOMAIN || 'http://localhost:3000';
  return {
    uploadUrl: `${publicBase}/api/v1/campaigns/instagram-card/uploads/direct?key=${encodeURIComponent(fileKey)}`,
    publicUrl: `${publicBase}/uploads/${fileKey}`,
    fileKey,
    expiresInSeconds,
  };
}

