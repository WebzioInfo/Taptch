import { pgTable, text, timestamp, varchar, integer, real, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { profiles } from './profiles';

export interface ShippingAddressData {
  recipientName: string;
  phone: string;
  email?: string;
  whatsappNumber?: string;
  street: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  deliveryInstructions?: string;
}

/**
 * Physical NFC Card Orders Table
 * Tracks physical card manufacturing, profile association, multi-gateway payments, and logistics tracking.
 */
export const orders = pgTable('orders', {
  id: varchar('id', { length: 64 }).primaryKey(),
  orderNumber: varchar('order_number', { length: 32 }).notNull().unique(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  profileId: varchar('profile_id', { length: 64 })
    .references(() => profiles.id, { onDelete: 'set null' }),
  material: varchar('material', { length: 32 }).notNull().default('pvc'), // 'pvc' | 'metal' | 'wood'
  quantity: integer('quantity').notNull().default(1),
  shippingAddress: jsonb('shipping_address').$type<ShippingAddressData>().notNull(),
  orderStatus: varchar('order_status', { length: 32 }).notNull().default('ORDER_PLACED'), // 'ORDER_PLACED' | 'PAYMENT_PENDING' | 'ORDER_CONFIRMED' | 'DESIGN_REVIEW' | 'CARD_PRODUCTION' | 'CARD_READY' | 'DISPATCHED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'ON_HOLD'
  paymentStatus: varchar('payment_status', { length: 32 }).notNull().default('PENDING'), // 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'COD_PENDING' | 'COD_COLLECTED'
  paymentMethod: varchar('payment_method', { length: 32 }).notNull().default('razorpay'), // 'razorpay' | 'upi' | 'cod' | 'offline'
  paymentReference: varchar('payment_reference', { length: 128 }),
  profileAssistanceStatus: varchar('profile_assistance_status', { length: 32 }).notNull().default('NOT_REQUIRED'), // 'NOT_REQUIRED' | 'REQUESTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'
  profileAssistanceNotes: text('profile_assistance_notes'),
  subtotal: real('subtotal').notNull().default(0),
  shippingCost: real('shipping_cost').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  totalAmount: real('total_amount').notNull().default(0),
  currency: varchar('currency', { length: 8 }).notNull().default('INR'),
  trackingNumber: varchar('tracking_number', { length: 128 }),
  courierName: varchar('courier_name', { length: 64 }),
  trackingUrl: text('tracking_url'),
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  idempotencyKey: varchar('idempotency_key', { length: 128 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdempotencyIdx: uniqueIndex('idx_orders_user_idempotency').on(table.userId, table.idempotencyKey),
}));

/**
 * Real-time Order Status History Timeline Table
 * Stores permanent historical log of order progress events with timestamps and executor attribution.
 */
export const orderStatusHistory = pgTable('order_status_history', {
  id: varchar('id', { length: 64 }).primaryKey(),
  orderId: varchar('order_id', { length: 64 })
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 32 }).notNull(),
  title: varchar('title', { length: 128 }).notNull(),
  description: text('description'),
  updatedBy: text('updated_by').default('system'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Payments & Financial Audit Table
 * Captures discrete payment transaction records for Razorpay, simulated UPI, and Cash on Delivery.
 */
export const payments = pgTable('payments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  orderId: varchar('order_id', { length: 64 })
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  paymentMethod: varchar('payment_method', { length: 32 }).notNull(), // 'razorpay' | 'upi' | 'cod' | 'offline'
  amount: real('amount').notNull(),
  currency: varchar('currency', { length: 8 }).notNull().default('INR'),
  status: varchar('status', { length: 32 }).notNull().default('PENDING'), // 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'COD_PENDING' | 'COD_COLLECTED'
  gatewayOrderId: varchar('gateway_order_id', { length: 128 }),
  gatewayPaymentId: varchar('gateway_payment_id', { length: 128 }),
  gatewaySignature: text('gateway_signature'),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
