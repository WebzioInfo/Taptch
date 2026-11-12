import { pgTable, text, timestamp, boolean, varchar, integer } from 'drizzle-orm/pg-core';
import { organizations, users } from './auth';
import { profiles } from './profiles';

export const cardBatches = pgTable('card_batches', {
  id: varchar('id', { length: 64 }).primaryKey(),
  batchCode: varchar('batch_code', { length: 64 }).notNull().unique(), // e.g. 'BATCH-2026-OCT-01'
  quantity: integer('quantity').notNull(),
  material: varchar('material', { length: 32 }).notNull(), // 'pvc' | 'metal' | 'wood'
  chipType: varchar('chip_type', { length: 32 }).notNull(), // 'ntag213' | 'ntag215' | 'ntag216'
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const cards = pgTable('cards', {
  id: varchar('id', { length: 64 }).primaryKey(),
  serialNumber: varchar('serial_number', { length: 64 }).notNull().unique(), // Printed human ID e.g. TPZ-100234
  uid: varchar('uid', { length: 64 }), // Physical chip UID hex if scanned during QC
  redirectToken: varchar('redirect_token', { length: 32 }).notNull().unique(), // Unguessable token (>= 64 bits entropy)
  activationCodeHash: varchar('activation_code_hash', { length: 255 }).notNull(), // Argon2id or SHA-256 salted hash
  material: varchar('material', { length: 32 }).notNull().default('pvc'),
  chipType: varchar('chip_type', { length: 32 }).notNull().default('ntag213'),
  status: varchar('status', { length: 32 }).notNull().default('unclaimed'), // 'unclaimed' | 'active' | 'lost' | 'deactivated'
  batchId: varchar('batch_id', { length: 64 }).references(() => cardBatches.id, { onDelete: 'set null' }),
  profileId: varchar('profile_id', { length: 64 }).references(() => profiles.id, { onDelete: 'set null' }),
  ownerUserId: text('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'set null' }),
  activatedAt: timestamp('activated_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cardAssignments = pgTable('card_assignments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  cardId: varchar('card_id', { length: 64 })
    .notNull()
    .references(() => cards.id, { onDelete: 'cascade' }),
  profileId: varchar('profile_id', { length: 64 })
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  assignedBy: text('assigned_by')
    .notNull()
    .references(() => users.id),
  reason: varchar('reason', { length: 64 }).default('reassign'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const cardEvents = pgTable('card_events', {
  id: varchar('id', { length: 64 }).primaryKey(),
  cardId: varchar('card_id', { length: 64 }).references(() => cards.id, { onDelete: 'set null' }),
  profileId: varchar('profile_id', { length: 64 }).references(() => profiles.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 32 }).notNull(), // 'nfc_open' | 'qr_scan' | 'profile_view'
  deviceCategory: varchar('device_category', { length: 32 }), // 'mobile' | 'tablet' | 'desktop'
  browser: varchar('browser', { length: 32 }),
  os: varchar('os', { length: 32 }),
  country: varchar('country', { length: 8 }),
  city: varchar('city', { length: 64 }),
  referrer: text('referrer'),
  visitorHash: varchar('visitor_hash', { length: 64 }).notNull(), // Daily rotating salted hash, no raw IP
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const activationAttempts = pgTable('activation_attempts', {
  id: varchar('id', { length: 64 }).primaryKey(),
  token: varchar('token', { length: 32 }).notNull(),
  ipAddress: varchar('ip_address', { length: 64 }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  success: boolean('success').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

