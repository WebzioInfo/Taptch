import { pgTable, text, timestamp, boolean, varchar, integer } from 'drizzle-orm/pg-core';
import { organizations, users } from './auth';
import { profiles } from './profiles';
import { cards } from './cards';

export const qrBatches = pgTable('qr_batches', {
  id: varchar('id', { length: 64 }).primaryKey(),
  batchCode: varchar('batch_code', { length: 64 }).notNull().unique(), // e.g. 'QRB-2026-NOV-001'
  name: varchar('name', { length: 128 }).notNull(),
  quantity: integer('quantity').notNull(),
  qrType: varchar('qr_type', { length: 32 }).notNull().default('dynamic'), // 'dynamic' | 'static'
  destinationCategory: varchar('destination_category', { length: 32 }).notNull().default('profile'),
  productType: varchar('product_type', { length: 32 }).notNull().default('sticker'), // 'sticker' | 'standee' | 'card' | 'packaging'
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const qrCodes = pgTable('qr_codes', {
  id: varchar('id', { length: 64 }).primaryKey(),
  serialNumber: varchar('serial_number', { length: 64 }).notNull().unique(), // e.g. 'TPZ-QR-10001'
  token: varchar('token', { length: 32 }).notNull().unique(), // Unguessable token (>= 72 bits entropy)
  batchId: varchar('batch_id', { length: 64 }).references(() => qrBatches.id, { onDelete: 'set null' }),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'set null' }),
  ownerUserId: text('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
  cardId: varchar('card_id', { length: 64 }).references(() => cards.id, { onDelete: 'set null' }),
  
  // Destination Routing
  destinationType: varchar('destination_type', { length: 32 }).notNull().default('profile'), // 'profile' | 'url' | 'whatsapp' | 'vcard' | 'multilink'
  profileId: varchar('profile_id', { length: 64 }).references(() => profiles.id, { onDelete: 'set null' }),
  targetUrl: text('target_url'),
  destinationPayload: text('destination_payload'), // JSON metadata for whatsapp/vcard/custom
  
  // Lifecycle & Status
  status: varchar('status', { length: 32 }).notNull().default('available'), // 'draft' | 'available' | 'assigned' | 'active' | 'disabled' | 'archived'
  isDynamic: boolean('is_dynamic').notNull().default(true),
  
  // Studio Design Configuration (JSON string)
  designConfig: text('design_config'),
  
  // QC Verification
  isVerified: boolean('is_verified').notNull().default(false),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: text('verified_by').references(() => users.id),

  activatedAt: timestamp('activated_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const qrScanEvents = pgTable('qr_scan_events', {
  id: varchar('id', { length: 64 }).primaryKey(),
  qrId: varchar('qr_id', { length: 64 }).notNull().references(() => qrCodes.id, { onDelete: 'cascade' }),
  profileId: varchar('profile_id', { length: 64 }).references(() => profiles.id, { onDelete: 'set null' }),
  destinationType: varchar('destination_type', { length: 32 }).notNull(),
  resolvedUrl: text('resolved_url').notNull(),
  
  deviceCategory: varchar('device_category', { length: 32 }), // 'mobile' | 'tablet' | 'desktop' | 'bot'
  browser: varchar('browser', { length: 32 }),
  os: varchar('os', { length: 32 }),
  country: varchar('country', { length: 8 }),
  city: varchar('city', { length: 64 }),
  referrer: text('referrer'),
  visitorHash: varchar('visitor_hash', { length: 64 }).notNull(), // Daily rotating DPDP salt
  isBot: boolean('is_bot').notNull().default(false),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

