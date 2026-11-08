/**
 * TAPTCH CLOUDFLARE STORAGE & ASSET MANAGEMENT TYPES
 */

export type StorageProviderType = 'cloudflare_images' | 'cloudflare_r2' | 'mock';

export type MediaCategory =
  | 'avatar'
  | 'cover'
  | 'logo'
  | 'business_cover'
  | 'gallery'
  | 'product'
  | 'service'
  | 'business_gallery'
  | 'video'
  | 'brochure'
  | 'template'
  | 'nfc_product';

export interface StorageFolderTaxonomy {
  personalAvatars: string;
  personalCovers: string;
  personalGalleries: string;
  businessLogos: string;
  businessCovers: string;
  businessProducts: string;
  businessServices: string;
  businessGalleries: string;
  documents: string;
  videos: string;
  templates: string;
  nfcProducts: string;
}

export interface UploadMediaOptions {
  folder: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  publicIdPrefix?: string;
  tags?: string[];
  ownerId: string;
  profileId?: string;
  businessId?: string;
  mediaCategory: MediaCategory;
  fileName?: string;
  mimeType?: string;
}

export interface MediaAssetResult {
  id: string;
  publicId: string; // Storage key / Cloudflare Image ID / R2 Key
  storageKey: string;
  secureUrl: string; // Canonical delivery URL (imagedelivery.net or assets CDN)
  storageProvider: StorageProviderType;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
  resourceType: string;
  mimeType?: string;
}

export interface DirectUploadParams {
  uploadUrl: string;
  imageId?: string;
  storageProvider: StorageProviderType;
  folder: string;
  tags: string[];
}

export interface ImageTransformationOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'thumb' | 'scale' | 'cover' | 'contain';
  gravity?: 'face' | 'center' | 'auto';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
  variant?: 'public' | 'avatar' | 'cover' | 'thumbnail' | string;
  radius?: number | 'max';
}
