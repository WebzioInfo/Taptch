import { pgTable, text, timestamp, varchar, integer } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { orders } from './orders';

/**
 * Platform Expenses Table
 * Tracks operational expenses, infrastructure, shipping, and manufacturing costs.
 */
export const expenses = pgTable('expenses', {
  id: varchar('id', { length: 64 }).primaryKey(),
  category: varchar('category', { length: 64 }).notNull(), // 'infrastructure' | 'shipping' | 'packaging' | 'cogs' | 'marketing' | 'operations'
  title: varchar('title', { length: 255 }).notNull(),
  amount: integer('amount').notNull(), // Stored in minor currency unit (e.g. INR paise or whole rupees)
  currency: varchar('currency', { length: 8 }).notNull().default('INR'),
  incurredAt: timestamp('incurred_at').notNull().defaultNow(),
  recordedBy: text('recorded_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  receiptUrl: text('receipt_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Platform Financial Transactions Table
 * Explicit double-entry ledger distinguishing collected revenue, refunds, and COGS.
 */
export const financialTransactions = pgTable('financial_transactions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  orderId: varchar('order_id', { length: 64 }).references(() => orders.id, { onDelete: 'set null' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 32 }).notNull(), // 'revenue' | 'refund' | 'cogs' | 'shipping_cost' | 'gateway_fee'
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 8 }).notNull().default('INR'),
  status: varchar('status', { length: 32 }).notNull().default('settled'), // 'settled' | 'pending' | 'reversed'
  paymentMethod: varchar('payment_method', { length: 32 }).notNull().default('manual_offline'), // 'upi' | 'bank_transfer' | 'manual_offline' | 'waived'
  referenceNumber: varchar('128'),
  settledAt: timestamp('settled_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
