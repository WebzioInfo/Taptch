-- Migration 0022: Independent NFC Card Destinations & Permanent Redirect Tokens

ALTER TABLE "cards"
  ADD COLUMN IF NOT EXISTS "destination_type" varchar(32) NOT NULL DEFAULT 'profile',
  ADD COLUMN IF NOT EXISTS "custom_destination_url" text;

ALTER TABLE "purchased_cards"
  ADD COLUMN IF NOT EXISTS "redirect_token" varchar(32),
  ADD COLUMN IF NOT EXISTS "destination_type" varchar(32),
  ADD COLUMN IF NOT EXISTS "custom_destination_url" text;

-- Backfill permanent redirect tokens for any existing purchased_cards without one
UPDATE "purchased_cards"
SET "redirect_token" = lower(substr(md5("id" || ':' || "order_item_id" || ':' || "unit_index"::text), 1, 12))
WHERE "redirect_token" IS NULL;

-- Backfill destination_type = 'profile' for existing cards that already have a linked profile
UPDATE "purchased_cards"
SET "destination_type" = 'profile'
WHERE "profile_id" IS NOT NULL AND "destination_type" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_purchased_cards_redirect_token" ON "purchased_cards" ("redirect_token");
