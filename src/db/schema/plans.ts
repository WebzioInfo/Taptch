import { pgTable, text, timestamp, boolean, jsonb, varchar } from 'drizzle-orm/pg-core';
import { organizations, users } from './auth';

export const plans = pgTable('plans', {
  id: varchar('id', { length: 64 }).primaryKey(), // 'free', 'pro', 'business', 'enterprise'
  name: varchar('name', { length: 128 }).notNull(),
  description: text('description').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const planEntitlements = pgTable('plan_entitlements', {
  id: varchar('id', { length: 64 }).primaryKey(),
  planId: varchar('plan_id', { length: 64 })
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  entitlementKey: varchar('entitlement_key', { length: 64 }).notNull(), // 'max_profiles', 'max_cards', etc.
  value: jsonb('value').$type<number | boolean | string>().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const tenantSubscriptions = pgTable('tenant_subscriptions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  planId: varchar('plan_id', { length: 64 })
    .notNull()
    .references(() => plans.id),
  assignedBy: text('assigned_by')
    .notNull()
    .references(() => users.id),
  status: varchar('status', { length: 32 }).notNull().default('active'), // 'active' | 'suspended' | 'expired'
  paymentStatus: varchar('payment_status', { length: 32 }).notNull().default('NOT_RECORDED'), // 'NOT_RECORDED' | 'PENDING_VERIFICATION' | 'PAID' | 'PARTIALLY_PAID' | 'WAIVED' | 'REFUNDED'
  amountInr: text('amount_inr'),
  validUntil: timestamp('valid_until'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

