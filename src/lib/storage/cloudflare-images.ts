/**
 * Cloudflare Images Provider Adapter
 * Integrates directly with Cloudflare Images v1 / v2 APIs.
 * https://developers.cloudflare.com/images/
 */

import { getCloudflareConfig } from './config';
import { ImageTransformationOptions } from './types';
import { logger } from '@/lib/logger';

export interface CloudflareImagesUploadResponse {
  result: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
}

export interface CloudflareDirectUploadResponse {
  result: {
    id: string;
    uploadURL: string;
  };
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
}

/**
 * Uploads an image buffer directly to Cloudflare Images API.
 */
export async function uploadToCloudflareImages(
  buffer: Buffer,
  filename: string,
  metadata?: Record<string, string | number | boolean>
): Promise<{ imageId: string; deliveryUrl: string; variants: string[] }> {
  const config = getCloudflareConfig();
  if (!config.isImagesConfigured) {
    throw new Error('Cloudflare Images is not configured.');
  }

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: 'application/octet-stream' });
  formData.append('file', blob, filename);

  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/images/v1`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.imagesApiToken}`,
    },
    body: formData,
  });

  const data = (await response.json()) as CloudflareImagesUploadResponse;

  if (!response.ok || !data.success || !data.result) {
    const errorDetails = data.errors?.map((e) => e.message).join(', ') || response.statusText;
    logger.error({ errorDetails }, 'Cloudflare Images API upload failed');
    throw new Error(`Cloudflare Images upload failed: ${errorDetails}`);
  }

  const imageId = data.result.id;
  const deliveryUrl = `https://imagedelivery.net/${config.imagesAccountHash}/${imageId}/public`;

  return {
    imageId,
    deliveryUrl,
    variants: data.result.variants || [deliveryUrl],
  };
}

/**
 * Creates an authenticated Direct Creator Upload URL.
 * Allows client browsers to upload images directly to Cloudflare Images without routing through the application server.
 */
export async function createDirectUploadUrl(
  metadata?: Record<string, string | number | boolean>,
  expiryMinutes: number = 30
): Promise<{ uploadUrl: string; imageId: string }> {
  const config = getCloudflareConfig();
  if (!config.isImagesConfigured) {
    throw new Error('Cloudflare Images is not configured.');
  }

  const formData = new FormData();
  formData.append('expiry', new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString());
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/images/v2/direct_upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.imagesApiToken}`,
    },
    body: formData,
  });

  const data = (await response.json()) as CloudflareDirectUploadResponse;

  if (!response.ok || !data.success || !data.result) {
    const errorDetails = data.errors?.map((e) => e.message).join(', ') || response.statusText;
    logger.error({ errorDetails }, 'Failed to create Cloudflare Direct Upload URL');
    throw new Error(`Cloudflare Direct Upload creation failed: ${errorDetails}`);
  }

  return {
    uploadUrl: data.result.uploadURL,
    imageId: data.result.id,
  };
}

/**
 * Constructs an optimized Cloudflare delivery URL using variants or dynamic parameters.
 */
export function buildCloudflareImageUrl(
  imageId: string,
  options: ImageTransformationOptions = {}
): string {
  const config = getCloudflareConfig();

  if (!imageId) return '';

  // Return as-is if already an external/absolute URL
  if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
    return imageId;
  }

  const variant = options.variant || 'public';
  const accountHash = config.imagesAccountHash || 'taptch';

  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}

/**
 * Deletes an image from Cloudflare Images.
 */
export async function deleteFromCloudflareImages(imageId: string): Promise<boolean> {
  const config = getCloudflareConfig();
  if (!config.isImagesConfigured) {
    return true; // Soft bypass if not configured
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/images/v1/${imageId}`;

  try {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${config.imagesApiToken}`,
      },
    });

    const data = await response.json();
    return Boolean(response.ok && data.success);
  } catch (err) {
    logger.warn({ err, imageId }, 'Error deleting asset from Cloudflare Images');
    return false;
  }
}
