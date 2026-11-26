-- Migration 0024: Six Independent Purchasable NFC Products (No Variant Color Switching)
ALTER TABLE "card_products" ADD COLUMN IF NOT EXISTS "material" varchar(32) NOT NULL DEFAULT 'pvc';
ALTER TABLE "card_products" ADD COLUMN IF NOT EXISTS "color_name" varchar(64) NOT NULL DEFAULT 'Black';
ALTER TABLE "card_products" ADD COLUMN IF NOT EXISTS "color" varchar(32) NOT NULL DEFAULT '#000000';
ALTER TABLE "card_products" ADD COLUMN IF NOT EXISTS "theme_config" jsonb;

ALTER TABLE "purchased_cards" ADD COLUMN IF NOT EXISTS "color_name" varchar(64);
ALTER TABLE "purchased_cards" ADD COLUMN IF NOT EXISTS "color" varchar(32);
