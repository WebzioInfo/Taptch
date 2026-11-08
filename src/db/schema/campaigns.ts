import { pgTable, text, timestamp, varchar, integer, numeric, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './auth';

/**
 * 1. Campaign Global Settings & Lifecycle
 */
export const campaignSettings = pgTable('campaign_settings', {
  id: varchar('id', { length: 64 }).primaryKey(),
  campaignKey: varchar('campaign_key', { length: 64 }).notNull().unique(), // e.g. 'instagram-card'
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 32 }).notNull().default('ACTIVE'), // 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'ARCHIVED'
  supportWhatsapp: varchar('support_whatsapp', { length: 32 }).notNull().default('+919876543210'),
  designerWhatsapp: varchar('designer_whatsapp', { length: 32 }).notNull().default('+919876543211'),
  designerFee: integer('designer_fee').notNull().default(200), // in INR
  standardShippingFee: integer('standard_shipping_fee').notNull().default(60), // in INR
  expressShippingFee: integer('express_shipping_fee').notNull().default(150),
  taxRatePercent: numeric('tax_rate_percent', { precision: 5, scale: 2 }).notNull().default('18.00'), // 18% GST
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * 2. Campaign Product Catalog
 */
export const campaignProducts = pgTable('campaign_products', {
  id: varchar('id', { length: 64 }).primaryKey(),
  campaignKey: varchar('campaign_key', { length: 64 }).notNull(),
  name: varchar('name', { length: 128 }).notNull(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  material: varchar('material', { length: 32 }).notNull(), // 'PVC' | 'METAL' | 'BAMBOO'
  chipType: varchar('chip_type', { length: 32 }).notNull().default('NTAG216'),
  description: text('description').notNull(),
  basePrice: integer('base_price').notNull(), // INR minor units or whole INR (whole integer INR used across Taptch)
  manufacturingCost: integer('manufacturing_cost').notNull().default(150),
  packagingCost: integer('packaging_cost').notNull().default(30),
  stockAvailable: integer('stock_available').notNull().default(100),
  stockReserved: integer('stock_reserved').notNull().default(0),
  imageUrl: text('image_url').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * 3. Campaign Orders Table
 */
export const campaignOrders = pgTable('campaign_orders', {
  id: varchar('id', { length: 64 }).primaryKey(), // Internal UUID
  orderNumber: varchar('order_number', { length: 32 }).notNull().unique(), // e.g. 'TAP-2026-000101'
  barcode: varchar('barcode', { length: 64 }).notNull().unique(), // Code 128 scan value
  campaignKey: varchar('campaign_key', { length: 64 }).notNull().default('instagram-card'),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  
  // Customer Details
  customerName: varchar('customer_name', { length: 128 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 32 }).notNull(),
  instagramUsername: varchar('instagram_username', { length: 128 }).notNull(),
  instagramUrl: text('instagram_url').notNull(),
  shippingAddress: jsonb('shipping_address').$type<{
    recipientName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  }>().notNull(),

  // Line Item & Option
  productId: varchar('product_id', { length: 64 }).notNull().references(() => campaignProducts.id),
  productName: varchar('product_name', { length: 128 }).notNull(),
  material: varchar('material', { length: 32 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  designOption: varchar('design_option', { length: 32 }).notNull(), // 'DIY' | 'DESIGNER'
  designNotes: text('design_notes'),

  // Financial Breakdown (Stored as Exact INR Integers)
  unitPrice: integer('unit_price').notNull(),
  customizationFee: integer('customization_fee').notNull().default(0),
  designerFee: integer('designer_fee').notNull().default(0),
  shippingFee: integer('shipping_fee').notNull().default(0),
  discountAmount: integer('discount_amount').notNull().default(0),
  taxAmount: integer('tax_amount').notNull().default(0),
  totalAmount: integer('total_amount').notNull(),
  amountPaid: integer('amount_paid').notNull().default(0),

  // Distinct Operational State Machines
  paymentStatus: varchar('payment_status', { length: 32 }).notNull().default('UNPAID'), 
  // 'UNPAID' | 'PAYMENT_REPORTED' | 'PARTIALLY_PAID' | 'PAID' | 'REFUND_PENDING' | 'PARTIALLY_REFUNDED' | 'REFUNDED'
  
  designStatus: varchar('design_status', { length: 32 }).notNull().default('DESIGN_PENDING'),
  // 'DESIGN_PENDING' | 'DESIGN_IN_PROGRESS' | 'DESIGN_APPROVAL_PENDING' | 'DESIGN_APPROVED' | 'REVISION_REQUESTED'
  
  productionStatus: varchar('production_status', { length: 32 }).notNull().default('PENDING_PRODUCTION'),
  // 'PENDING_PRODUCTION' | 'IN_PRODUCTION' | 'QUALITY_CHECK' | 'PRODUCED'
  
  shippingStatus: varchar('shipping_status', { length: 32 }).notNull().default('NOT_SHIPPED'),
  // 'NOT_SHIPPED' | 'READY_TO_SHIP' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED'

  orderStatus: varchar('order_status', { length: 32 }).notNull().default('PENDING_PAYMENT'),
  // Overall state e.g. 'PENDING_PAYMENT' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'

  // Logistics & Tracking
  courierProvider: varchar('courier_provider', { length: 64 }), // e.g. 'Delhivery' | 'BlueDart' | 'SpeedPost'
  trackingNumber: varchar('tracking_number', { length: 128 }),
  dispatchedAt: timestamp('dispatched_at'),
  deliveredAt: timestamp('delivered_at'),

  // Staff Assignment
  assignedDesignerId: text('assigned_designer_id').references(() => users.id, { onDelete: 'set null' }),
  designerAssignedAt: timestamp('designer_assigned_at'),

  internalNotes: text('internal_notes'),
  idempotencyKey: varchar('idempotency_key', { length: 128 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('idx_campaign_orders_num').on(table.orderNumber),
  index('idx_campaign_orders_barcode').on(table.barcode),
  index('idx_campaign_orders_phone').on(table.customerPhone),
  index('idx_campaign_orders_idempotency').on(table.idempotencyKey),
]);

/**
 * 4. Submitted Design Snapshots (Immutable design proof per order)
 */
export const campaignDesigns = pgTable('campaign_designs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  orderId: varchar('order_id', { length: 64 }).notNull().references(() => campaignOrders.id, { onDelete: 'cascade' }),
  templateId: varchar('template_id', { length: 64 }).notNull(),
  versionNumber: integer('version_number').notNull().default(1),
  isApproved: boolean('is_approved').notNull().default(false),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  frontDesignJson: jsonb('front_design_json').$type<{
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    avatarUrl?: string;
    logoUrl?: string;
    instagramUsername: string;
    headline?: string;
    accentColor?: string;
  }>().notNull(),
  backDesignJson: jsonb('back_design_json').$type<{
    qrDestination: string;
    tagline?: string;
    showLogo: boolean;
  }>().notNull(),
  previewFrontUrl: text('preview_front_url'),
  previewBackUrl: text('preview_back_url'),
  printReadyArtworkUrl: text('print_ready_artwork_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * 5. Immutable Financial Payments Ledger
 */
export const campaignPayments = pgTable('campaign_payments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  orderId: varchar('order_id', { length: 64 }).notNull().references(() => campaignOrders.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  paymentMethod: varchar('payment_method', { length: 32 }).notNull(), // 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'OTHER'
  transactionReference: varchar('transaction_reference', { length: 128 }).notNull(), // UTR / RRN / Bank Ref
  paymentDate: timestamp('payment_date').notNull().defaultNow(),
  evidenceUrl: text('evidence_url'), // Uploaded screenshot receipt
  isVerified: boolean('is_verified').notNull().default(false),
  verifiedBy: text('verified_by').references(() => users.id, { onDelete: 'set null' }),
  verifiedAt: timestamp('verified_at'),
  internalNotes: text('internal_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('idx_campaign_payments_ref').on(table.transactionReference),
  index('idx_campaign_payments_order').on(table.orderId),
]);

/**
 * 6. Refunds Ledger
 */
export const campaignRefunds = pgTable('campaign_refunds', {
  id: varchar('id', { length: 64 }).primaryKey(),
  orderId: varchar('order_id', { length: 64 }).notNull().references(() => campaignOrders.id, { onDelete: 'cascade' }),
  paymentId: varchar('payment_id', { length: 64 }).references(() => campaignPayments.id, { onDelete: 'set null' }),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  refundMethod: varchar('refund_method', { length: 32 }).notNull(), // 'UPI_REVERSAL' | 'BANK_TRANSFER'
  transactionReference: varchar('transaction_reference', { length: 128 }).notNull(),
  authorizedBy: text('authorized_by').notNull().references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * 7. Operational & Manufacturing Expenses
 */
export const campaignExpenses = pgTable('campaign_expenses', {
  id: varchar('id', { length: 64 }).primaryKey(),
  campaignKey: varchar('campaign_key', { length: 64 }).notNull().default('instagram-card'),
  category: varchar('category', { length: 64 }).notNull(), 
  // 'CHIP_PURCHASE' | 'CARD_MANUFACTURING' | 'PRINTING' | 'PACKAGING' | 'COURIER' | 'MARKETING_ADS' | 'DESIGNER_PAYOUT' | 'MISCELLANEOUS'
  amount: integer('amount').notNull(),
  expenseDate: timestamp('expense_date').notNull().defaultNow(),
  vendor: varchar('vendor', { length: 128 }).notNull(),
  description: text('description').notNull(),
  transactionReference: varchar('transaction_reference', { length: 128 }),
  receiptUrl: text('receipt_url'),
  isCogs: boolean('is_cogs').notNull().default(true), // Direct cost of goods sold vs general overhead
  enteredBy: text('entered_by').notNull().references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * 8. Inventory & Stock Ledger
 */
export const campaignInventoryMovements = pgTable('campaign_inventory_movements', {
  id: varchar('id', { length: 64 }).primaryKey(),
  productId: varchar('product_id', { length: 64 }).notNull().references(() => campaignProducts.id, { onDelete: 'cascade' }),
  movementType: varchar('movement_type', { length: 32 }).notNull(),
  // 'PURCHASE' | 'STOCK_IN' | 'STOCK_RESERVED' | 'STOCK_RELEASED' | 'PRODUCTION_USED' | 'DAMAGE' | 'RETURN' | 'DISPATCH'
  quantity: integer('quantity').notNull(),
  orderId: varchar('order_id', { length: 64 }).references(() => campaignOrders.id, { onDelete: 'set null' }),
  unitCost: integer('unit_cost'),
  reason: text('reason').notNull(),
  performedBy: text('performed_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * 9. Issued Financial Documents (Invoices, Receipts, Packing Slips)
 */
export const campaignDocuments = pgTable('campaign_documents', {
  id: varchar('id', { length: 64 }).primaryKey(),
  orderId: varchar('order_id', { length: 64 }).notNull().references(() => campaignOrders.id, { onDelete: 'cascade' }),
  documentType: varchar('document_type', { length: 32 }).notNull(), // 'ORDER_CONFIRMATION' | 'RECEIPT' | 'TAX_INVOICE' | 'PACKING_SLIP'
  documentNumber: varchar('document_number', { length: 64 }).notNull().unique(), // e.g. 'INV-2026-000001'
  fileUrl: text('file_url'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  generatedBy: text('generated_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

