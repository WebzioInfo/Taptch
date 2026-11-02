import { pgTable, text, timestamp, varchar, integer } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { profiles, profileBusinesses } from './profiles';

/**
 * Cloudinary Media Assets Registry Table
 * Centralized tracking of all images, videos, and PDF documents hosted on Cloudinary.
 */
export const mediaAssets = pgTable('media_assets', {
  id: varchar('id', { length: 64 }).primaryKey(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  profileId: varchar('profile_id', { length: 64 }).references(() => profiles.id, { onDelete: 'set null' }),
  businessId: varchar('business_id', { length: 64 }).references(() => profileBusinesses.id, { onDelete: 'set null' }),
  resourceType: varchar('resource_type', { length: 32 }).notNull().default('image'), // 'image' | 'video' | 'raw'
  mediaCategory: varchar('media_category', { length: 64 }).notNull(), // 'avatar' | 'cover' | 'logo' | 'gallery' | 'product' | 'service' | 'video' | 'brochure' | 'template' | 'nfc_product'
  cloudinaryPublicId: varchar('cloudinary_public_id', { length: 255 }).notNull().unique(),
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

