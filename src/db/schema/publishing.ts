import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { profiles } from './profiles';
import { plans } from './plans';

/**
 * Publication Requests Table
 * Tracks customer submission of digital profiles for admin review and approval.
 */
export const publicationRequests = pgTable('publication_requests', {
  id: varchar('id', { length: 64 }).primaryKey(),
  profileId: varchar('profile_id', { length: 64 })
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 32 }).notNull().default('PENDING_PUBLICATION'),
  // 'DRAFT' | 'PENDING_PUBLICATION' | 'UNDER_REVIEW' | 'PLAN_PENDING' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'CORRECTIONS_REQUESTED' | 'SUSPENDED' | 'UNPUBLISHED'
  requestedPlanId: varchar('requested_plan_id', { length: 64 }).references(() => plans.id),
  adminNotes: text('admin_notes'),
  rejectionReason: text('rejection_reason'),
  correctionsRequested: text('corrections_requested'),
  customerContactPhone: varchar('customer_contact_phone', { length: 32 }),
  customerContactWhatsapp: varchar('customer_contact_whatsapp', { length: 32 }),
  reviewedBy: text('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Plan Assignment & Payment Audit Log Table
 * Records every manual plan assignment, upgrade, downgrade, and payment status change.
 */
export const planAssignmentHistory = pgTable('plan_assignment_history', {
  id: varchar('id', { length: 64 }).primaryKey(),
  subscriptionId: varchar('subscription_id', { length: 64 }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  fromPlanId: varchar('from_plan_id', { length: 64 }),
  toPlanId: varchar('to_plan_id', { length: 64 }).notNull(),
  assignedBy: text('assigned_by')
    .notNull()
    .references(() => users.id),
  action: varchar('action', { length: 64 }).notNull(), // 'ASSIGN' | 'UPGRADE' | 'DOWNGRADE' | 'RENEW' | 'EXPIRE' | 'SUSPEND' | 'REACTIVATE'
  paymentStatus: varchar('payment_status', { length: 32 }).notNull().default('NOT_RECORDED'), // 'NOT_RECORDED' | 'PENDING_VERIFICATION' | 'PAID' | 'PARTIALLY_PAID' | 'WAIVED' | 'REFUNDED'
  amountInr: text('amount_inr'),
  validUntil: timestamp('valid_until'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

