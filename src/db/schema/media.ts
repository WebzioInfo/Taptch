import { pgTable, text, timestamp, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { profiles, profileBusinesses } from './profiles';

/**
 * Universal Media Assets Registry Table
 * Centralized tracking of all images, videos, and PDF documents hosted on Cloudflare (Images / R2).
 * Maintains backward-compatible fallback fields for historical migrations.
 */
export const mediaAssets = pgTable('media_assets', {
  id: varchar('id', { length: 64 }).primaryKey(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  profileId: varchar('profile_id', { length: 64 }).references(() => profiles.id, { onDelete: 'set null' }),
  businessId: varchar('business_id', { length: 64 }).references(() => profileBusinesses.id, { onDelete: 'set null' }),
  storageProvider: varchar('storage_provider', { length: 32 }).notNull().default('cloudflare_images'), // 'cloudflare_images' | 'cloudflare_r2' | 'mock'
  storageKey: varchar('storage_key', { length: 255 }), // Cloudflare Image ID or R2 object key
  storageObjectId: varchar('storage_object_id', { length: 255 }), // Full unique object identifier
  assetUrl: text('asset_url'), // Canonical delivery URL
  assetType: varchar('asset_type', { length: 32 }).notNull().default('image'), // 'image' | 'video' | 'document' | 'raw'
  mimeType: varchar('mime_type', { length: 100 }),
  isPublic: boolean('is_public').notNull().default(true),
  resourceType: varchar('resource_type', { length: 32 }).notNull().default('image'), // Legacy compatibility: 'image' | 'video' | 'raw'
  mediaCategory: varchar('media_category', { length: 64 }).notNull(), // 'avatar' | 'cover' | 'logo' | 'gallery' | 'product' | 'service' | 'video' | 'brochure' | 'template' | 'nfc_product'
  cloudinaryPublicId: varchar('cloudinary_public_id', { length: 255 }), // Preserved for backward-compatibility during migration
  secureUrl: text('secure_url').notNull(),
  format: varchar('format', { length: 32 }),
  fileSize: integer('file_size'),
  width: integer('width'),
  height: integer('height'),
  duration: integer('duration'), // For videos in seconds
  visibilityStatus: varchar('visibility_status', { length: 32 }).notNull().default('public'), // 'public' | 'private'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
