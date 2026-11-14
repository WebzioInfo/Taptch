import { pgTable, text, timestamp, varchar, integer, boolean, real } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { orders } from './orders';

/**
 * Physical NFC Card Products Table
 * Represents physical card models (e.g. Matte PVC, Brushed Metal, Titanium, Wood)
 * with precise manufacturing dimensions and print safe zones.
 */
export const cardProducts = pgTable('card_products', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  slug: varchar('slug', { length: 128 }).notNull().unique(),
  description: text('description').notNull(),
  basePrice: real('base_price').notNull().default(1499),
  discountPrice: real('discount_price'),
  canvasWidth: integer('canvas_width').notNull().default(1050),
  canvasHeight: integer('canvas_height').notNull().default(600),
  safeZone: integer('safe_zone').notNull().default(40),
  bleedZone: integer('bleed_zone').notNull().default(25),
  supportedSides: varchar('supported_sides', { length: 32 }).notNull().default('FRONT_AND_BACK'), // 'FRONT_ONLY' | 'FRONT_AND_BACK'
  mockupType: varchar('mockup_type', { length: 32 }).notNull().default('CARD_3D'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Product Variants Table (Finishes, Coatings, Edge Foils)
 */
export const cardProductVariants = pgTable('card_product_variants', {
  id: varchar('id', { length: 64 }).primaryKey(),
  productId: varchar('product_id', { length: 64 })
    .notNull()
    .references(() => cardProducts.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 128 }).notNull(),
  color: varchar('color', { length: 32 }).notNull().default('#121216'),
  finish: varchar('finish', { length: 64 }).notNull().default('matte'),
  price: real('price').notNull().default(1499),
  sku: varchar('sku', { length: 64 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Card Design Templates Table
 * Stores master vector layout compositions (front and back Fabric.js JSON)
 */
export const cardDesignTemplates = pgTable('card_design_templates', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  category: varchar('category', { length: 64 }).notNull().default('Corporate'), // Corporate, Luxury, Minimal, Creative
  style: varchar('style', { length: 64 }).notNull().default('Minimal'),
  previewUrl: text('preview_url').notNull(),
  frontArtworkUrl: text('front_artwork_url'),
  backArtworkUrl: text('back_artwork_url'),
  frontCanvasJson: text('front_canvas_json').notNull(),
  backCanvasJson: text('back_canvas_json'),
  isGlobal: boolean('is_global').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Product-Template Junction Table
 */
export const cardProductTemplates = pgTable('card_product_templates', {
  productId: varchar('product_id', { length: 64 })
    .notNull()
    .references(() => cardProducts.id, { onDelete: 'cascade' }),
  templateId: varchar('template_id', { length: 64 })
    .notNull()
    .references(() => cardDesignTemplates.id, { onDelete: 'cascade' }),
});

/**
 * Customer Card Designs Table
 * Stores customer-customized vector designs with autosave and draft capabilities.
 */
export const cardDesigns = pgTable('card_designs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  customerId: text('customer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 64 })
    .notNull()
    .references(() => cardProducts.id, { onDelete: 'cascade' }),
  templateId: varchar('template_id', { length: 64 }).references(() => cardDesignTemplates.id, {
    onDelete: 'set null',
  }),
  variantId: varchar('variant_id', { length: 64 }).references(() => cardProductVariants.id, {
    onDelete: 'set null',
  }),
  name: varchar('name', { length: 128 }).notNull().default('Untitled NFC Card'),
  frontCanvasJson: text('front_canvas_json').notNull(),
  backCanvasJson: text('back_canvas_json'),
  previewUrl: text('preview_url'),
  backPreviewUrl: text('back_preview_url'),
  isDraft: boolean('is_draft').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Cart Items Table
 * Associates selected card products, finishes, and customized vector designs
 */
export const cartItems = pgTable('cart_items', {
  id: varchar('id', { length: 64 }).primaryKey(),
  customerId: text('customer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 64 })
    .notNull()
    .references(() => cardProducts.id, { onDelete: 'cascade' }),
  variantId: varchar('variant_id', { length: 64 }).references(() => cardProductVariants.id, {
    onDelete: 'set null',
  }),
  designId: varchar('design_id', { length: 64 }).references(() => cardDesigns.id, {
    onDelete: 'set null',
  }),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Order Items Table with Frozen Manufacturing Snapshots
 * Captures an immutable snapshot of front & back vector artwork at checkout.
 */
export const orderItems = pgTable('order_items', {
  id: varchar('id', { length: 64 }).primaryKey(),
  orderId: varchar('order_id', { length: 64 })
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 64 })
    .notNull()
    .references(() => cardProducts.id),
  productName: varchar('product_name', { length: 128 }).notNull(),
  variantName: varchar('variant_name', { length: 128 }),
  unitPrice: real('unit_price').notNull(),
  quantity: integer('quantity').notNull().default(1),
  total: real('total').notNull(),
  designSnapshotJson: text('design_snapshot_json'), // Frozen immutable snapshot
  designPreviewUrl: text('design_preview_url'),
  backPreviewUrl: text('back_preview_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

