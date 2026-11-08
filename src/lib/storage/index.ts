/**
 * TAPTCH CENTRALIZED STORAGE & ASSET MANAGEMENT SERVICE
 *
 * Replaces Cloudinary with Cloudflare Images (for high-speed image delivery & transformations)
 * and Cloudflare R2 (for PDF documents, video showcases, and original files).
 */

import { logger } from '@/lib/logger';
import { db } from '@/db';
import { mediaAssets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  StorageProviderType,
  MediaCategory,
  StorageFolderTaxonomy,
  UploadMediaOptions,
  MediaAssetResult,
  DirectUploadParams,
  ImageTransformationOptions,
} from './types';
import { getCloudflareConfig } from './config';
import {
  uploadToCloudflareImages,
  createDirectUploadUrl,
  buildCloudflareImageUrl,
  deleteFromCloudflareImages,
} from './cloudflare-images';
import {
  uploadToCloudflareR2,
  deleteFromCloudflareR2,
} from './cloudflare-r2';

export * from './types';
export * from './config';
export * from './cloudflare-images';
export * from './cloudflare-r2';

/**
 * Standardized Cloudflare Storage Taxonomy
 */
export const STORAGE_FOLDERS: StorageFolderTaxonomy = {
  personalAvatars: 'profiles/avatars',
  personalCovers: 'profiles/covers',
  personalGalleries: 'profiles/galleries',
  businessLogos: 'businesses/logos',
  businessCovers: 'businesses/covers',
  businessProducts: 'businesses/products',
  businessServices: 'businesses/services',
  businessGalleries: 'businesses/galleries',
  documents: 'documents/brochures',
  videos: 'videos/showcases',
  templates: 'templates/previews',
  nfcProducts: 'nfc/products',
};

/**
 * Deprecated alias for backward-compatibility with older tests & callers
 */
export const CLOUDINARY_FOLDERS = STORAGE_FOLDERS;

/**
 * Uploads a file buffer directly to Cloudflare and persists metadata in PostgreSQL.
 * Routes images to Cloudflare Images, and documents/videos to Cloudflare R2.
 */
export async function uploadMediaBuffer(
  buffer: Buffer,
  options: UploadMediaOptions
): Promise<MediaAssetResult> {
  const config = getCloudflareConfig();
  const assetId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const isVideo = options.resourceType === 'video' || options.mediaCategory === 'video';
  const isDocument =
    options.resourceType === 'raw' ||
    options.mediaCategory === 'brochure' ||
    options.fileName?.endsWith('.pdf');

  const assetType: 'image' | 'video' | 'document' | 'raw' = isVideo
    ? 'video'
    : isDocument
    ? 'document'
    : 'image';

  const storageProvider: StorageProviderType =
    !config.isConfigured || process.env.NODE_ENV === 'test'
      ? 'mock'
      : isVideo || isDocument
      ? 'cloudflare_r2'
      : 'cloudflare_images';

  // 1. Mock / Offline fallback for tests and development without Cloudflare credentials
  if (storageProvider === 'mock') {
    logger.warn(
      { assetId, folder: options.folder, provider: storageProvider },
      '[MOCK] Cloudflare storage not configured; simulating media upload'
    );

    const mockStorageKey = `${options.folder}/${assetId}`;
    const mockDeliveryUrl =
      assetType === 'document'
        ? `https://assets.taptch.com/${mockStorageKey}.pdf`
        : assetType === 'video'
        ? `https://assets.taptch.com/${mockStorageKey}.mp4`
        : `https://imagedelivery.net/${config.imagesAccountHash || 'mock-hash'}/${assetId}/public`;

    await db.insert(mediaAssets).values({
      id: assetId,
      ownerId: options.ownerId,
      profileId: options.profileId || null,
      businessId: options.businessId || null,
      storageProvider: 'mock',
      storageKey: mockStorageKey,
      storageObjectId: assetId,
      assetUrl: mockDeliveryUrl,
      assetType,
      mimeType: options.mimeType || (assetType === 'document' ? 'application/pdf' : 'image/webp'),
      isPublic: true,
      resourceType: options.resourceType === 'auto' ? 'image' : options.resourceType || 'image',
      mediaCategory: options.mediaCategory,
      cloudinaryPublicId: mockStorageKey, // Backward compatibility
      secureUrl: mockDeliveryUrl, // Backward compatibility
      format: assetType === 'document' ? 'pdf' : assetType === 'video' ? 'mp4' : 'webp',
      fileSize: buffer.length,
      width: assetType === 'image' ? 800 : undefined,
      height: assetType === 'image' ? 800 : undefined,
      visibilityStatus: 'public',
    });

    return {
      id: assetId,
      publicId: mockStorageKey,
      storageKey: mockStorageKey,
      secureUrl: mockDeliveryUrl,
      storageProvider: 'mock',
      format: assetType === 'document' ? 'pdf' : 'webp',
      bytes: buffer.length,
      width: assetType === 'image' ? 800 : undefined,
      height: assetType === 'image' ? 800 : undefined,
      resourceType: options.resourceType || 'image',
      mimeType: options.mimeType || (assetType === 'document' ? 'application/pdf' : 'image/webp'),
    };
  }

  // 2. Real Cloudflare R2 Upload for Documents & Videos
  if (storageProvider === 'cloudflare_r2') {
    const ext = isDocument ? 'pdf' : 'mp4';
    const key = `${options.folder}/${assetId}.${ext}`;
    const contentType =
      options.mimeType || (isDocument ? 'application/pdf' : isVideo ? 'video/mp4' : 'application/octet-stream');

    const { publicUrl } = await uploadToCloudflareR2(buffer, key, contentType);

    await db.insert(mediaAssets).values({
      id: assetId,
      ownerId: options.ownerId,
      profileId: options.profileId || null,
      businessId: options.businessId || null,
      storageProvider: 'cloudflare_r2',
      storageKey: key,
      storageObjectId: key,
      assetUrl: publicUrl,
      assetType,
      mimeType: contentType,
      isPublic: true,
      resourceType: options.resourceType || (isDocument ? 'raw' : 'video'),
      mediaCategory: options.mediaCategory,
      cloudinaryPublicId: key,
      secureUrl: publicUrl,
      format: ext,
      fileSize: buffer.length,
      visibilityStatus: 'public',
    });

    logger.info({ assetId, key, provider: 'cloudflare_r2' }, 'R2 asset persisted successfully');

    return {
      id: assetId,
      publicId: key,
      storageKey: key,
      secureUrl: publicUrl,
      storageProvider: 'cloudflare_r2',
      format: ext,
      bytes: buffer.length,
      resourceType: options.resourceType || (isDocument ? 'raw' : 'video'),
      mimeType: contentType,
    };
  }

  // 3. Real Cloudflare Images Upload for Image Assets
  const filename = options.fileName || `${assetId}.png`;
  const uploadResult = await uploadToCloudflareImages(buffer, filename, {
    ownerId: options.ownerId,
    category: options.mediaCategory,
    profileId: options.profileId || '',
  });

  const deliveryUrl = uploadResult.deliveryUrl;
  const imageId = uploadResult.imageId;

  await db.insert(mediaAssets).values({
    id: assetId,
    ownerId: options.ownerId,
    profileId: options.profileId || null,
    businessId: options.businessId || null,
    storageProvider: 'cloudflare_images',
    storageKey: imageId,
    storageObjectId: imageId,
    assetUrl: deliveryUrl,
    assetType: 'image',
    mimeType: options.mimeType || 'image/webp',
    isPublic: true,
    resourceType: 'image',
    mediaCategory: options.mediaCategory,
    cloudinaryPublicId: imageId,
    secureUrl: deliveryUrl,
    format: 'webp',
    fileSize: buffer.length,
    visibilityStatus: 'public',
  });

  logger.info({ assetId, imageId, provider: 'cloudflare_images' }, 'Cloudflare Images asset persisted successfully');

  return {
    id: assetId,
    publicId: imageId,
    storageKey: imageId,
    secureUrl: deliveryUrl,
    storageProvider: 'cloudflare_images',
    format: 'webp',
    bytes: buffer.length,
    resourceType: 'image',
    mimeType: options.mimeType || 'image/webp',
  };
}

/**
 * Generates direct upload parameters for client-side direct uploads to Cloudflare.
 */
export async function generateSignedUploadParams(
  folder: string,
  tags: string[] = ['taptch']
): Promise<DirectUploadParams> {
  const config = getCloudflareConfig();

  if (!config.isImagesConfigured || process.env.NODE_ENV === 'test') {
    return {
      uploadUrl: '/api/v1/media/upload',
      storageProvider: 'mock',
      folder,
      tags,
    };
  }

  try {
    const directUpload = await createDirectUploadUrl({ folder, tags: tags.join(',') });
    return {
      uploadUrl: directUpload.uploadUrl,
      imageId: directUpload.imageId,
      storageProvider: 'cloudflare_images',
      folder,
      tags,
    };
  } catch (err) {
    logger.warn({ err }, 'Falling back to server upload proxy URL');
    return {
      uploadUrl: '/api/v1/media/upload',
      storageProvider: 'cloudflare_images',
      folder,
      tags,
    };
  }
}

/**
 * Constructs an optimized image delivery URL using Cloudflare Images variants.
 */
export function getTransformedImageUrl(
  publicIdOrUrl: string,
  options: ImageTransformationOptions = {}
): string {
  if (!publicIdOrUrl) return '';

  // If already a full URL
  if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
    // If it's a Cloudflare image delivery URL and variant is requested
    if (publicIdOrUrl.includes('imagedelivery.net') && options.variant) {
      const parts = publicIdOrUrl.split('/');
      parts[parts.length - 1] = options.variant;
      return parts.join('/');
    }
    return publicIdOrUrl;
  }

  return buildCloudflareImageUrl(publicIdOrUrl, options);
}

/**
 * Deletes a media asset from Cloudflare (Images / R2) and removes its database record.
 * Strictly verifies that the requesting actor owns the asset or is an admin.
 */
export async function deleteMediaAsset(
  assetId: string,
  actorId: string,
  isAdmin: boolean = false
): Promise<{ success: boolean; error?: string }> {
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

  const provider = asset.storageProvider || 'cloudflare_images';
  const key = asset.storageKey || asset.cloudinaryPublicId || asset.id;

  try {
    if (provider === 'cloudflare_images') {
      await deleteFromCloudflareImages(key);
    } else if (provider === 'cloudflare_r2') {
      await deleteFromCloudflareR2(key);
    }
  } catch (err) {
    logger.warn({ err, assetId, provider }, 'Cloudflare asset remote deletion warning');
  }

  // Delete from PostgreSQL database
  await db.delete(mediaAssets).where(eq(mediaAssets.id, assetId));
  logger.info({ assetId, actorId, provider }, 'Media asset database record deleted successfully');

  return { success: true };
}

/**
 * Lists media assets belonging to a specific user.
 */
export async function listUserMediaAssets(ownerId: string, category?: string) {
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
