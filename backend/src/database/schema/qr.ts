import { pgTable, text, timestamp, boolean, varchar, integer } from 'drizzle-orm/pg-core';
import { organizations, users } from './auth';
import { profiles } from './profiles';
import { cards } from './cards';

export const qrCategories = pgTable('qr_categories', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  slug: varchar('slug', { length: 128 }).notNull().unique(), // e.g. 'google-reviews', 'restaurant-menu'
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const qrGroups = pgTable('qr_groups', {
  id: varchar('id', { length: 64 }).primaryKey(),
  label: varchar('label', { length: 128 }).notNull(),
  qrCount: integer('qr_count').notNull().default(0),
  categoryId: varchar('category_id', { length: 64 }).references(() => qrCategories.id, { onDelete: 'set null' }),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const qrBatches = pgTable('qr_batches', {
  id: varchar('id', { length: 64 }).primaryKey(),
  batchCode: varchar('batch_code', { length: 64 }).notNull().unique(), // e.g. 'QRB-2026-NOV-001'
  name: varchar('name', { length: 128 }).notNull(),
  quantity: integer('quantity').notNull(),
  startFrom: integer('start_from').notNull().default(1),
  qrType: varchar('qr_type', { length: 32 }).notNull().default('single'), // 'single' | 'multi_link' | 'dynamic' | 'static'
  destinationCategory: varchar('destination_category', { length: 32 }).notNull().default('profile'),
  productType: varchar('product_type', { length: 32 }).notNull().default('sticker'), // 'sticker' | 'standee' | 'card' | 'packaging'
  
  // Parameterized template tokens
  paramName: varchar('param_name', { length: 64 }),
  valuePrefix: varchar('value_prefix', { length: 64 }),
  sep: varchar('sep', { length: 16 }),
  templateUrl: text('template_url'),
  
  groupId: varchar('group_id', { length: 64 }).references(() => qrGroups.id, { onDelete: 'set null' }),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const qrCodes = pgTable('qr_codes', {
  id: varchar('id', { length: 64 }).primaryKey(),
  serialNumber: varchar('serial_number', { length: 64 }).notNull().unique(), // e.g. 'TPZ-QR-10001'
  token: varchar('token', { length: 32 }).notNull().unique(), // 8-char lowercase URL-safe hex string
  label: varchar('label', { length: 120 }), // e.g. 'Batch 01 - Table #12'
  
  groupId: varchar('group_id', { length: 64 }).references(() => qrGroups.id, { onDelete: 'set null' }),
  batchId: varchar('batch_id', { length: 64 }).references(() => qrBatches.id, { onDelete: 'set null' }),
  batchLabel: varchar('batch_label', { length: 128 }),
  batchSize: integer('batch_size'),
  batchSequence: integer('batch_sequence'), // 1-based index within batch (1..N)
  
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'set null' }),
  ownerUserId: text('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
  cardId: varchar('card_id', { length: 64 }).references(() => cards.id, { onDelete: 'set null' }),
  
  // Destination Routing
  qrType: varchar('qr_type', { length: 32 }).notNull().default('single'), // 'single' | 'multi_link'
  destinationType: varchar('destination_type', { length: 32 }).notNull().default('url'), // 'url' | 'profile' | 'whatsapp' | 'vcard' | 'multilink'
  manualRedirectUrl: text('manual_redirect_url'), // Destination URL when assigned
  targetUrl: text('target_url'), // Backwards compatibility alias
  idValue: varchar('id_value', { length: 64 }), // Custom tracking identifier e.g. 'TABLE-14', 'ROOM-102'
  
  profileId: varchar('profile_id', { length: 64 }).references(() => profiles.id, { onDelete: 'set null' }),
  destinationPayload: text('destination_payload'), // JSON metadata for whatsapp/vcard/custom
  
  // Lifecycle & Status
  status: varchar('status', { length: 32 }).notNull().default('unassigned'), // 'unassigned' | 'assigned' | 'disabled' | 'archived'
  isDynamic: boolean('is_dynamic').notNull().default(true),
  
  // Field Staff & Assignment Tracking
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  assignedBy: text('assigned_by').references(() => users.id, { onDelete: 'set null' }),
  assignedAt: timestamp('assigned_at'), // Primary metric for calendar heatmap analytics
  lastReassignedAt: timestamp('last_reassigned_at'),
  
  // Scan Tracking
  scanCount: integer('scan_count').notNull().default(0),
  lastScannedAt: timestamp('last_scanned_at'),
  
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
