import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './auth';

export const inventoryItems = pgTable('inventory_items', {
  id: varchar('id', { length: 64 }).primaryKey(),
  material: varchar('material', { length: 32 }).notNull().unique(),
  sku: varchar('sku', { length: 64 }).notNull().unique(),
  availableQty: integer('available_qty').notNull().default(0),
  reservedQty: integer('reserved_qty').notNull().default(0),
  soldQty: integer('sold_qty').notNull().default(0),
  damagedQty: integer('damaged_qty').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(20),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    inventoryItemId: varchar('inventory_item_id', { length: 64 })
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'cascade' }),
    movementType: varchar('movement_type', { length: 32 }).notNull(), // 'RECEIPT' | 'ADJUSTMENT' | 'DAMAGED' | 'LOST' | 'RESERVED' | 'SOLD'
    quantityDelta: integer('quantity_delta').notNull(),
    reason: text('reason').notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 128 }),
    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    idempotencyIdx: uniqueIndex('idx_inventory_movements_idempotency').on(table.idempotencyKey),
    itemIdx: index('idx_inventory_movements_item').on(table.inventoryItemId),
  }),
);

export const adminAlerts = pgTable(
  'admin_alerts',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    alertType: varchar('alert_type', { length: 64 }).notNull(),
    severity: varchar('severity', { length: 16 }).notNull().default('WARNING'), // 'INFO' | 'WARNING' | 'CRITICAL'
    dedupeKey: varchar('dedupe_key', { length: 128 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    resourceType: varchar('resource_type', { length: 64 }),
    resourceId: varchar('resource_id', { length: 64 }),
    status: varchar('status', { length: 24 }).notNull().default('ACTIVE'), // 'ACTIVE' | 'RESOLVED' | 'DISMISSED'
    isRead: boolean('is_read').notNull().default(false),
    resolvedBy: text('resolved_by').references(() => users.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    dedupeIdx: index('idx_admin_alerts_dedupe').on(table.dedupeKey, table.status),
  }),
);

export const adminLoginHistory = pgTable(
  'admin_login_history',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    email: varchar('email', { length: 255 }).notNull(),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: text('user_agent'),
    success: boolean('success').notNull().default(false),
    failureReason: varchar('failure_reason', { length: 128 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_admin_login_history_user').on(table.userId),
    createdIdx: index('idx_admin_login_history_created').on(table.createdAt),
  }),
);

export const supportTickets = pgTable(
  'support_tickets',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    ticketNumber: varchar('ticket_number', { length: 32 }).notNull().unique(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    subject: varchar('subject', { length: 255 }).notNull(),
    category: varchar('category', { length: 64 }).notNull().default('general'), // 'general' | 'order' | 'card' | 'billing' | 'profile'
    priority: varchar('priority', { length: 32 }).notNull().default('medium'), // 'low' | 'medium' | 'high' | 'urgent'
    status: varchar('status', { length: 32 }).notNull().default('open'), // 'open' | 'in_progress' | 'resolved' | 'closed'
    assignedTo: text('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index('idx_support_tickets_status').on(table.status),
    userIdx: index('idx_support_tickets_user').on(table.userId),
  }),
);

export const supportTicketMessages = pgTable(
  'support_ticket_messages',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    ticketId: varchar('ticket_id', { length: 64 })
      .notNull()
      .references(() => supportTickets.id, { onDelete: 'cascade' }),
    senderId: text('sender_id').references(() => users.id, { onDelete: 'set null' }),
    senderRole: varchar('sender_role', { length: 32 }).notNull().default('user'),
    message: text('message').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    ticketIdx: index('idx_support_ticket_messages_ticket').on(table.ticketId),
  }),
);

export const userNotifications = pgTable(
  'user_notifications',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 64 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    resourceType: varchar('resource_type', { length: 64 }),
    resourceId: varchar('resource_id', { length: 64 }),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_user_notifications_user').on(table.userId, table.isRead),
  }),
);
