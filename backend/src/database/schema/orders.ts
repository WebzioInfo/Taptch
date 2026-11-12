import { pgTable, text, timestamp, varchar, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { profiles } from './profiles';

/**
 * Physical Hardware Order Requests Table
 * Tracks physical card requests, manual payments (waived / paid_offline / unpaid), and production stages.
 */
export const orders = pgTable('orders', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  profileId: varchar('profile_id', { length: 64 })
    .references(() => profiles.id, { onDelete: 'set null' }),
  material: varchar('material', { length: 32 }).notNull().default('pvc'), // 'pvc' | 'metal'
  quantity: integer('quantity').notNull().default(1),
  shippingAddress: jsonb('shipping_address').$type<{
    recipientName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  }>().notNull(),
  orderStatus: varchar('order_status', { length: 32 }).notNull().default('requested'), // 'requested' | 'in_production' | 'qc' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: varchar('payment_status', { length: 32 }).notNull().default('unpaid'), // 'unpaid' | 'paid_offline' | 'waived'
  trackingNumber: varchar('tracking_number', { length: 128 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
