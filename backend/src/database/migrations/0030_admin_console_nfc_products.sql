-- Migration 0030: Admin Console Extensions for NFC Cards Registry & Products Catalogue
-- Reuses existing card_products and purchased_cards tables without duplicating tables.

-- 1. Extend card_products with finish and stock_status for admin catalogue management
ALTER TABLE "card_products"
  ADD COLUMN IF NOT EXISTS "finish" varchar(64) DEFAULT 'solid-matte',
  ADD COLUMN IF NOT EXISTS "stock_status" varchar(32) NOT NULL DEFAULT 'IN_STOCK';

-- 2. Extend purchased_cards for standalone admin card registration, chip UID, lifecycle status, feature flags, and tap analytics
ALTER TABLE "purchased_cards"
  ALTER COLUMN "order_id" DROP NOT NULL,
  ALTER COLUMN "order_item_id" DROP NOT NULL,
  ALTER COLUMN "user_id" DROP NOT NULL;

ALTER TABLE "purchased_cards"
  ADD COLUMN IF NOT EXISTS "card_code" varchar(32),
  ADD COLUMN IF NOT EXISTS "chip_uid" varchar(64),
  ADD COLUMN IF NOT EXISTS "status" varchar(32) NOT NULL DEFAULT 'UNASSIGNED',
  ADD COLUMN IF NOT EXISTS "feature_flags" jsonb NOT NULL DEFAULT '{"leadCapture":true,"vcardDownload":true,"whatsappButton":true,"analytics":true,"passwordProtection":false,"linkExpiryDate":null}'::jsonb,
  ADD COLUMN IF NOT EXISTS "tap_count" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "last_tapped_at" timestamp,
  ADD COLUMN IF NOT EXISTS "assigned_at" timestamp;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_purchased_cards_card_code" ON "purchased_cards" ("card_code") WHERE "card_code" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "idx_purchased_cards_chip_uid" ON "purchased_cards" ("chip_uid") WHERE "chip_uid" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_purchased_cards_status" ON "purchased_cards" ("status");
