-- Migration 0019: Card Preview URLs for card_designs and order_items
-- Adds preview_front_url and preview_back_url columns and backfills them from existing preview URLs

ALTER TABLE "card_designs" ADD COLUMN IF NOT EXISTS "preview_front_url" text;
ALTER TABLE "card_designs" ADD COLUMN IF NOT EXISTS "preview_back_url" text;

UPDATE "card_designs"
SET "preview_front_url" = "preview_url"
WHERE "preview_front_url" IS NULL AND "preview_url" IS NOT NULL;

UPDATE "card_designs"
SET "preview_back_url" = "back_preview_url"
WHERE "preview_back_url" IS NULL AND "back_preview_url" IS NOT NULL;

ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "preview_front_url" text;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "preview_back_url" text;

UPDATE "order_items"
SET "preview_front_url" = "design_preview_url"
WHERE "preview_front_url" IS NULL AND "design_preview_url" IS NOT NULL;

UPDATE "order_items"
SET "preview_back_url" = "back_preview_url"
WHERE "preview_back_url" IS NULL AND "back_preview_url" IS NOT NULL;
