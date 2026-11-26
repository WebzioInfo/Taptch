import { pgTable, text, timestamp, varchar, integer, boolean, real, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { orders } from './orders';
import { profiles } from './profiles';

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
  material: varchar('material', { length: 32 }).notNull().default('pvc'),
  colorName: varchar('color_name', { length: 64 }).notNull().default('Black'),
  color: varchar('color', { length: 32 }).notNull().default('#000000'),
  themeConfig: jsonb('theme_config').$type<{
    background: string;
    primaryText: string;
    secondaryText: string;
    accent: string;
    borderColor: string;
    qrColor: string;
  }>(),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Product Variants Table (Finishes, Coatings, Solid Color Themes)
 */
export const cardProductVariants = pgTable('card_product_variants', {
  id: varchar('id', { length: 64 }).primaryKey(),
  productId: varchar('product_id', { length: 64 })
    .notNull()
    .references(() => cardProducts.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 128 }).notNull(),
  color: varchar('color', { length: 32 }).notNull().default('#000000'),
  finish: varchar('finish', { length: 64 }).notNull().default('solid-matte'),
  price: real('price').notNull().default(1499),
  sku: varchar('sku', { length: 64 }),
  imageUrl: text('image_url'),
  themeConfig: jsonb('theme_config').$type<{
    background: string;
    primaryText: string;
    secondaryText: string;
    accent: string;
    borderColor: string;
    qrColor: string;
  }>(),
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
  profileId: varchar('profile_id', { length: 64 }).references(() => profiles.id, {
    onDelete: 'set null',
  }),
  name: varchar('name', { length: 128 }).notNull().default('Untitled NFC Card'),
  frontCanvasJson: text('front_canvas_json').notNull(),
  backCanvasJson: text('back_canvas_json'),
  previewUrl: text('preview_url'),
  backPreviewUrl: text('back_preview_url'),
  previewFrontUrl: text('preview_front_url'),
  previewBackUrl: text('preview_back_url'),
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
  previewFrontUrl: text('preview_front_url'),
  previewBackUrl: text('preview_back_url'),
  profileId: varchar('profile_id', { length: 64 }).references(() => profiles.id, {
    onDelete: 'set null',
  }),
  designId: varchar('design_id', { length: 64 }).references(() => cardDesigns.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Customer Purchase Journeys Table
 * Persists flow-oriented onboarding & purchase progress across sessions, refreshes, and auth redirects.
 */
export const purchaseJourneys = pgTable('purchase_journeys', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stage: varchar('stage', { length: 48 }).notNull().default('ACCOUNT_SETUP'),
  accountType: varchar('account_type', { length: 32 }),
  selectedProductId: varchar('selected_product_id', { length: 64 }),
  selectedVariantId: varchar('selected_variant_id', { length: 64 }),
  selectedCardTemplateId: varchar('selected_card_template_id', { length: 64 }),
  selectedProfileTemplateId: varchar('selected_profile_template_id', { length: 64 }),
  profileId: varchar('profile_id', { length: 64 }).references(() => profiles.id, {
    onDelete: 'set null',
  }),
  designId: varchar('design_id', { length: 64 }).references(() => cardDesigns.id, {
    onDelete: 'set null',
  }),
  quantity: integer('quantity').notNull().default(1),
  orderId: varchar('order_id', { length: 64 }).references(() => orders.id, {
    onDelete: 'set null',
  }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Purchased Card Allocations Table
 * Represents individual physical NFC cards purchased in an order.
 * Decouples card purchase from digital profile setup so each card has an independent
 * profileAssignmentStatus (AWAITING_PROFILE -> PROFILE_SETUP_IN_PROGRESS -> PROFILE_ATTACHED -> ACTIVATION_PENDING -> ACTIVE).
 */
export const purchasedCards = pgTable('purchased_cards', {
  id: varchar('id', { length: 64 }).primaryKey(),
  orderId: varchar('order_id', { length: 64 })
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  orderItemId: varchar('order_item_id', { length: 64 })
    .notNull()
    .references(() => orderItems.id, { onDelete: 'cascade' }),
  unitIndex: integer('unit_index').notNull().default(1),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id'),
  productId: varchar('product_id', { length: 64 }),
  productName: varchar('product_name', { length: 128 }),
  variantName: varchar('variant_name', { length: 128 }),
  material: varchar('material', { length: 32 }).notNull().default('pvc'),
  colorName: varchar('color_name', { length: 64 }),
  color: varchar('color', { length: 32 }),
  designId: varchar('design_id', { length: 64 }).references(() => cardDesigns.id, {
    onDelete: 'set null',
  }),
  previewFrontUrl: text('preview_front_url'),
  previewBackUrl: text('preview_back_url'),
  profileId: varchar('profile_id', { length: 64 }).references(() => profiles.id, {
    onDelete: 'set null',
  }),
  redirectToken: varchar('redirect_token', { length: 32 }),
  destinationType: varchar('destination_type', { length: 32 }), // 'profile' | 'custom_url' | null
  customDestinationUrl: text('custom_destination_url'),
  profileAssignmentStatus: varchar('profile_assignment_status', { length: 32 })
    .notNull()
    .default('AWAITING_PROFILE'),
  physicalCardId: varchar('physical_card_id', { length: 64 }),
  /**
   * nfcUrl — The URL currently written (or to be written) to the physical NFC chip.
   * Format: https://taptch.com/{profileUsername}
   * Generated when a profile is attached. Null until profile is set.
   */
  nfcUrl: text('nfc_url'),
  /**
   * profileUsername — Denormalized copy of profiles.slug for fast NFC URL display.
   * Updated when profile is attached/changed. Cleared when disconnected.
   */
  profileUsername: varchar('profile_username', { length: 128 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orderItemUnitIdx: uniqueIndex('idx_purchased_cards_item_unit').on(table.orderItemId, table.unitIndex),
  redirectTokenIdx: uniqueIndex('idx_purchased_cards_redirect_token').on(table.redirectToken),
}));

