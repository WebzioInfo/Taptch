/**
 * Cloudinary Direct Upload Pipeline & Validation
 * Handles client-side validation, SVG sanitization, cryptographically signed direct uploads,
 * and metadata persistence with fallback to server-side buffer upload.
 */

import { ApiClient } from '../services/api';

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB limit
export const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  sanitizedSvg?: string;
}

/**
 * Validates file type, size, and sanitizes SVG markup to prevent XSS.
 */
export async function validateUploadFile(file: File): Promise<UploadValidationResult> {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File exceeds maximum 15MB size limit (${(file.size / 1024 / 1024).toFixed(1)}MB).` };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported file format (${file.type}). Allowed: PNG, JPG, WEBP, SVG.` };
  }

  if (file.type === 'image/svg+xml') {
    try {
      const text = await file.text();
      // Block embedded scripts, javascript protocols, iframes, objects, and event handlers
      const maliciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript\s*:/gi,
        /<iframe\b/gi,
        /<object\b/gi,
        /<embed\b/gi,
        /\bon[a-z]+\s*=/gi,
      ];

      for (const pattern of maliciousPatterns) {
        if (pattern.test(text)) {
          return { valid: false, error: 'SVG contains prohibited scripts or executable attributes.' };
        }
      }

      return { valid: true, sanitizedSvg: text };
    } catch (err: any) {
      return { valid: false, error: `Failed to inspect SVG: ${err.message}` };
    }
  }

  return { valid: true };
}

export interface UploadedAsset {
  id: string;
  url: string;
  storageKey?: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

/**
 * Upload an image using signed direct browser-to-Cloudinary upload,
 * then records asset metadata via `/api/v1/uploads/record`.
 * Falls back to server-side multipart stream if direct CDN call fails.
 */
export async function uploadToCloudinaryAndPersist(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadedAsset> {
  const validation = await validateUploadFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    // 1. Request signature from Taptch backend
    const signRes = await ApiClient.post<any>('/api/v1/uploads/signature', {
      assetType: 'image',
      filename: file.name,
    });

    if (signRes && signRes.signature && signRes.apiKey && signRes.cloudName) {
      // 2. Direct browser upload to Cloudinary API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signRes.apiKey);
      formData.append('timestamp', String(signRes.timestamp));
      formData.append('signature', signRes.signature);
      if (signRes.folder) formData.append('folder', signRes.folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signRes.cloudName}/auto/upload`;
      const cRes = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      if (!cRes.ok) {
        throw new Error(`Cloudinary upload returned status ${cRes.status}`);
      }

      const cData = await cRes.json();

      // 3. Persist asset record in Taptch backend
      const record = await ApiClient.post<UploadedAsset>('/api/v1/uploads/record', {
        url: cData.secure_url,
        storageKey: cData.public_id,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: cData.bytes || file.size,
        width: cData.width,
        height: cData.height,
        assetType: 'image',
      });

      if (onProgress) onProgress(100);
      return record;
    }
  } catch (directErr) {
    console.warn('[cloudinaryDirectUpload] Direct upload failed, attempting backend fallback:', directErr);
  }

  // Fallback: Server-side multipart upload
  const fallbackFormData = new FormData();
  fallbackFormData.append('file', file);
  fallbackFormData.append('assetType', 'image');

  const fallbackRecord = await ApiClient.post<UploadedAsset>('/api/v1/uploads', fallbackFormData);
  if (onProgress) onProgress(100);
  return fallbackRecord;
}

