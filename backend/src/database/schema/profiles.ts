import { pgTable, text, timestamp, jsonb, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { organizations, users } from './auth';

/**
 * Visual Template Registry Table
 * Stores metadata and configuration for profile templates in the marketplace.
 */
export const templates = pgTable('templates', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  slug: varchar('slug', { length: 128 }).notNull().unique(),
  description: text('description').notNull(),
  category: varchar('category', { length: 64 }).notNull(), // 'personal' | 'business' | 'corporate' | 'creative' | 'tech' | etc.
  thumbnailUrl: text('thumbnail_url').notNull(),
  supportedProfileTypes: jsonb('supported_profile_types').$type<string[]>().notNull().default(['personal', 'business']),
  requiredPlanId: varchar('required_plan_id', { length: 32 }).notNull().default('nano'),
  defaultThemeConfig: jsonb('default_theme_config').$type<Record<string, unknown>>().notNull().default({}),
  isFeatured: boolean('is_featured').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Digital Profiles Table
 * Core digital identity entity supporting both Personal and Single Business modes.
 */
export const profiles = pgTable('profiles', {
  id: varchar('id', { length: 64 }).primaryKey(),
  slug: varchar('slug', { length: 128 }).notNull().unique(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  profileType: varchar('profile_type', { length: 32 }).notNull().default('personal'), // 'personal' | 'business'
  displayName: varchar('display_name', { length: 128 }).notNull(),
  headline: varchar('headline', { length: 255 }),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  coverUrl: text('cover_url'),
  phone: varchar('phone', { length: 32 }),
  whatsapp: varchar('whatsapp', { length: 32 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  address: text('address'),
  location: varchar('location', { length: 255 }),
  socialLinks: jsonb('social_links').$type<{ platform: string; url: string }[]>().notNull().default([]),
  skills: jsonb('skills').$type<string[]>().notNull().default([]),
  experience: jsonb('experience').$type<{ company: string; role: string; period?: string; description?: string }[]>().notNull().default([]),
  education: jsonb('education').$type<{ institution: string; degree: string; year?: string }[]>().notNull().default([]),
  achievements: jsonb('achievements').$type<{ title: string; year?: string; description?: string }[]>().notNull().default([]),
  portfolio: jsonb('portfolio').$type<{ title: string; imageUrl?: string; linkUrl?: string; description?: string }[]>().notNull().default([]),
  gallery: jsonb('gallery').$type<{ url: string; caption?: string }[]>().notNull().default([]),
  videos: jsonb('videos').$type<{ title: string; videoUrl: string; thumbnailUrl?: string }[]>().notNull().default([]),
  brochures: jsonb('brochures').$type<{ title: string; fileUrl: string; fileSize?: string }[]>().notNull().default([]),
  customFields: jsonb('custom_fields').$type<Record<string, unknown>>().notNull().default({}),
  templateId: varchar('template_id', { length: 64 }).notNull().default('obsidian-luxury'),
  themeId: varchar('theme_id', { length: 64 }).notNull().default('obsidian'), // Legacy alias
  themeConfig: jsonb('theme_config').$type<Record<string, unknown>>().notNull().default({}),
  status: varchar('status', { length: 32 }).notNull().default('DRAFT'), // 'DRAFT' | 'PENDING_PUBLICATION' | 'UNDER_REVIEW' | 'PLAN_PENDING' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED' | 'UNPUBLISHED'
  publishedJson: jsonb('published_json').$type<Record<string, unknown>>().default({}),
  version: integer('version').notNull().default(1),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Associated Businesses Table (Multiple Business Support for Personal Profiles)
 * Allows a personal profile to showcase multiple ventures (e.g. John Mathew's 3 companies).
 */
export const profileBusinesses = pgTable('profile_businesses', {
  id: varchar('id', { length: 64 }).primaryKey(),
  profileId: varchar('profile_id', { length: 64 })
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  tagline: varchar('tagline', { length: 255 }),
  logoUrl: text('logo_url'),
  coverUrl: text('cover_url'),
  description: text('description'),
  website: varchar('website', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 32 }),
  whatsapp: varchar('whatsapp', { length: 32 }),
  address: text('address'),
  googleMapsUrl: text('google_maps_url'),
  googleReviewUrl: text('google_review_url'),
  brochureUrl: text('brochure_url'),
  socialLinks: jsonb('social_links').$type<{ platform: string; url: string }[]>().notNull().default([]),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Profile Catalogue Items (Products & Services)
 * Supported for Single Business Profiles or associated child businesses.
 */
export const profileCatalogueItems = pgTable('profile_catalogue_items', {
  id: varchar('id', { length: 64 }).primaryKey(),
  profileId: varchar('profile_id', { length: 64 })
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  businessId: varchar('business_id', { length: 64 })
    .references(() => profileBusinesses.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 32 }).notNull(), // 'product' | 'service'
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  price: varchar('price', { length: 64 }),
  currency: varchar('currency', { length: 8 }).notNull().default('INR'),
  imageUrl: text('image_url'),
  actionUrl: text('action_url'),
  actionLabel: varchar('action_label', { length: 64 }).notNull().default('Enquire'),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Profile Sections Table
 * Dynamic configuration for section ordering, custom titles, and visibility toggling.
 */
export const profileSections = pgTable('profile_sections', {
  id: varchar('id', { length: 64 }).primaryKey(),
  profileId: varchar('profile_id', { length: 64 })
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  sectionType: varchar('section_type', { length: 64 }).notNull(), // 'identity' | 'contacts' | 'socials' | 'bio' | 'businesses' | 'products' | 'services' | 'gallery' | 'videos' | 'brochure' | 'google_review' | 'google_maps' | 'save_contact' | 'exchange_contact'
  title: varchar('title', { length: 128 }),
  isEnabled: boolean('is_enabled').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  configJson: jsonb('config_json').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
