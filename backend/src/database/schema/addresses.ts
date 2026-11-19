import { pgTable, text, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';
import { users } from './auth';

/**
 * Saved Addresses Table
 * Stores up to 5 user-saved delivery addresses with labels, default flags, and usage metrics.
 */
export const savedAddresses = pgTable('saved_addresses', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 32 }).notNull().default('Home'), // 'Home' | 'Work' | 'Other'
  customLabel: varchar('custom_label', { length: 64 }),
  recipientName: varchar('recipient_name', { length: 128 }).notNull(),
  phone: varchar('phone', { length: 32 }).notNull(),
  email: varchar('email', { length: 128 }),
  whatsappNumber: varchar('whatsapp_number', { length: 32 }),
  addressLine1: text('address_line1').notNull(),
  addressLine2: text('address_line2'),
  city: varchar('city', { length: 64 }).notNull(),
  state: varchar('state', { length: 64 }).notNull(),
  postalCode: varchar('postal_code', { length: 16 }).notNull(),
  country: varchar('country', { length: 64 }).notNull().default('India'),
  deliveryInstructions: text('delivery_instructions'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
});
