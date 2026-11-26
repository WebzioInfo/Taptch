-- Migration 0023: Fresh Solid-Color NFC Product Catalog & Variant Themes

ALTER TABLE "card_products"
  ADD COLUMN IF NOT EXISTS "image_url" text;

ALTER TABLE "card_product_variants"
  ADD COLUMN IF NOT EXISTS "image_url" text,
  ADD COLUMN IF NOT EXISTS "theme_config" jsonb;
