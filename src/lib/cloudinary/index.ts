/**
 * TAPPZIO CLOUDINARY MEDIA MANAGEMENT ENGINE
 *
 * Implements centralized media upload, signed direct upload generation,
 * responsive image transformation, document handling, and asset registry.
 */

import { v2 as cloudinary, type UploadApiResponse, type UploadApiOptions } from 'cloudinary';
import { logger } from '@/lib/logger';
import { db } from '@/db';
import { mediaAssets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  isConfigured: boolean;
}

/**
 * Standardized Cloudinary Folder Taxonomy
 */
export const CLOUDINARY_FOLDERS = {
  personalAvatars: 'tappzio/profiles/personal',
  personalCovers: 'tappzio/profiles/covers',
  personalGalleries: 'tappzio/profiles/galleries',
  businessLogos: 'tappzio/businesses/logos',
  businessCovers: 'tappzio/businesses/covers',
  businessProducts: 'tappzio/businesses/products',
  businessServices: 'tappzio/businesses/services',
  businessGalleries: 'tappzio/businesses/galleries',
  documents: 'tappzio/documents/brochures',
  videos: 'tappzio/videos',
  templates: 'tappzio/templates/previews',
  nfcProducts: 'tappzio/nfc-products',
} as const;

export type CloudinaryFolderKey = keyof typeof CLOUDINARY_FOLDERS;

/**
 * Resolves Cloudinary configuration from environment variables.
 */
export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
  const apiKey = process.env.CLOUDINARY_API_KEY || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

  const isConfigured = Boolean(cloudName && apiKey && apiSecret);

  return {
    cloudName,
    apiKey,
    apiSecret,
    isConfigured,
  };
}

let isInitialized = false;

export function initCloudinary(): typeof cloudinary {
  const config = getCloudinaryConfig();

  if (!isInitialized && config.isConfigured) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true,
    });
    isInitialized = true;
  }

  return cloudinary;
}

export interface UploadMediaOptions {
  folder: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  publicIdPrefix?: string;
  tags?: string[];
  ownerId: string;
  profileId?: string;
  businessId?: string;
  mediaCategory:
    | 'avatar'
    | 'cover'
    | 'logo'
    | 'gallery'
    | 'product'
    | 'service'
    | 'video'
    | 'brochure'
    | 'template'
    | 'nfc_product';
}

export interface MediaUploadResult {
  id: string;
  publicId: string;
  secureUrl: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
  resourceType: string;
}

/**
 * Uploads a file buffer directly to Cloudinary and persists metadata in PostgreSQL.
 */
export async function uploadMediaBuffer(
  buffer: Buffer,
  options: UploadMediaOptions
): Promise<MediaUploadResult> {
  const config = getCloudinaryConfig();
  const cld = initCloudinary();

  const assetId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Mock / Offline fallback for tests and development without Cloudinary credentials
  if (!config.isConfigured || process.env.NODE_ENV === 'test') {
    logger.warn({ assetId, folder: options.folder }, '[MOCK] Cloudinary not configured; simulating media upload');
    const mockPublicId = `${options.folder}/${assetId}`;
    const mockSecureUrl = `https://res.cloudinary.com/${config.cloudName || 'demo'}/${options.resourceType || 'image'}/upload/${mockPublicId}.webp`;

    await db.insert(mediaAssets).values({
      id: assetId,
      ownerId: options.ownerId,
      profileId: options.profileId || null,
      businessId: options.businessId || null,
      resourceType: options.resourceType === 'auto' ? 'image' : (options.resourceType || 'image'),
      mediaCategory: options.mediaCategory,
      cloudinaryPublicId: mockPublicId,
      secureUrl: mockSecureUrl,
      format: 'webp',
      fileSize: buffer.length,
      width: 800,
      height: 800,
      visibilityStatus: 'public',
    });

    return {
      id: assetId,
      publicId: mockPublicId,
      secureUrl: mockSecureUrl,
      format: 'webp',
      bytes: buffer.length,
      width: 800,
      height: 800,
      resourceType: options.resourceType || 'image',
    };
  }

  return new Promise((resolve, reject) => {
    const uploadOptions: UploadApiOptions = {
      folder: options.folder,
      resource_type: options.resourceType || 'auto',
      tags: options.tags || ['tappzio', options.mediaCategory],
      unique_filename: true,
      overwrite: false,
    };

    const uploadStream = cld.uploader.upload_stream(
      uploadOptions,
      async (error: unknown, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          logger.error({ error }, 'Cloudinary buffer upload failed');
          return reject(error instanceof Error ? error : new Error(String(error)));
        }

        try {
          await db.insert(mediaAssets).values({
            id: assetId,
            ownerId: options.ownerId,
            profileId: options.profileId || null,
            businessId: options.businessId || null,
            resourceType: result.resource_type || 'image',
            mediaCategory: options.mediaCategory,
            cloudinaryPublicId: result.public_id,
            secureUrl: result.secure_url,
            format: result.format,
            fileSize: result.bytes,
            width: result.width,
            height: result.height,
            duration: result.duration ? Math.round(result.duration) : null,
            visibilityStatus: 'public',
          });

          logger.info({ assetId, publicId: result.public_id }, 'Cloudinary media upload persisted successfully');

          resolve({
            id: assetId,
            publicId: result.public_id,
            secureUrl: result.secure_url,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            duration: result.duration ? Math.round(result.duration) : undefined,
            resourceType: result.resource_type,
          });
        } catch (dbErr) {
          logger.error({ dbErr, publicId: result.public_id }, 'Failed to persist media asset record to database');
          reject(dbErr);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Generates signed parameters for secure direct client-side uploads.
 * Prevents client-side exposure of CLOUDINARY_API_SECRET.
 */
export function generateSignedUploadParams(folder: string, tags: string[] = ['tappzio']) {
  const config = getCloudinaryConfig();
  const cld = initCloudinary();

  const timestamp = Math.round(new Date().getTime() / 1000);
  const tagString = tags.join(',');

  const paramsToSign = {
    folder,
    tags: tagString,
    timestamp,
  };

  const signature = cld.utils.api_sign_request(paramsToSign, config.apiSecret || 'dev-mock-secret');

  return {
    signature,
    timestamp,
    apiKey: config.apiKey,
    cloudName: config.cloudName,
    folder,
    tags: tagString,
  };
}

export interface ImageTransformationOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'thumb' | 'scale';
  gravity?: 'face' | 'center' | 'auto';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
  radius?: number | 'max';
}

/**
 * Builds an optimized Cloudinary delivery URL with automatic format and compression.
 */
export function getTransformedImageUrl(
  publicId: string,
  options: ImageTransformationOptions = {}
): string {
  const cld = initCloudinary();

  if (!publicId) return '';

  // If already a full URL and not from our Cloudinary, return as-is
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    if (!publicId.includes('res.cloudinary.com')) {
      return publicId;
    }
  }

  const {
    width,
    height,
    crop = 'fill',
    gravity = 'auto',
    quality = 'auto',
    format = 'auto',
    radius,
  } = options;

  return cld.url(publicId, {
    width,
    height,
    crop,
    gravity,
    quality,
    fetch_format: format,
    radius,
    secure: true,
  });
}

/**
 * Deletes a media asset from Cloudinary and removes its database record,
 * verifying that the requesting actor owns the asset.
 */
export async function deleteMediaAsset(
  assetId: string,
  actorId: string,
  isAdmin: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const cld = initCloudinary();

  const [asset] = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, assetId))
    .limit(1);

  if (!asset) {
    return { success: false, error: 'Media asset not found.' };
  }

  if (asset.ownerId !== actorId && !isAdmin) {
    return { success: false, error: 'Unauthorized: You do not own this media asset.' };
  }

  // Delete from Cloudinary
  try {
    const config = getCloudinaryConfig();
    if (config.isConfigured && process.env.NODE_ENV !== 'test') {
      await cld.uploader.destroy(asset.cloudinaryPublicId, {
        resource_type: asset.resourceType || 'image',
      });
    }
  } catch (cldErr) {
    logger.warn({ cldErr, publicId: asset.cloudinaryPublicId }, 'Cloudinary asset deletion returned warning');
  }

  // Delete from database
  await db.delete(mediaAssets).where(eq(mediaAssets.id, assetId));
  logger.info({ assetId, actorId }, 'Media asset record deleted successfully');

  return { success: true };
}

/**
 * Lists media assets belonging to a user or profile.
 */
export async function listUserMediaAssets(
  ownerId: string,
  category?: string
) {
  const query = db
    .select()
    .from(mediaAssets)
    .where(
      category
        ? and(eq(mediaAssets.ownerId, ownerId), eq(mediaAssets.mediaCategory, category))
        : eq(mediaAssets.ownerId, ownerId)
    );

  return query;
}
