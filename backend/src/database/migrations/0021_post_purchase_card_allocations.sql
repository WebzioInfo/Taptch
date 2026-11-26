-- Migration 0021: Post-Purchase Card Allocations & Independent Profile Assignment Status

CREATE TABLE IF NOT EXISTS "purchased_cards" (
  "id" varchar(64) PRIMARY KEY,
  "order_id" varchar(64) NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "order_item_id" varchar(64) NOT NULL REFERENCES "order_items"("id") ON DELETE CASCADE,
  "unit_index" integer NOT NULL DEFAULT 1,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "organization_id" text,
  "product_id" varchar(64),
  "product_name" varchar(128),
  "variant_name" varchar(128),
  "material" varchar(32) NOT NULL DEFAULT 'pvc',
  "design_id" varchar(64) REFERENCES "card_designs"("id") ON DELETE SET NULL,
  "preview_front_url" text,
  "preview_back_url" text,
  "profile_id" varchar(64) REFERENCES "profiles"("id") ON DELETE SET NULL,
  "profile_assignment_status" varchar(32) NOT NULL DEFAULT 'AWAITING_PROFILE',
  "physical_card_id" varchar(64),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_purchased_cards_item_unit" ON "purchased_cards" ("order_item_id", "unit_index");
CREATE INDEX IF NOT EXISTS "idx_purchased_cards_user" ON "purchased_cards" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_purchased_cards_order" ON "purchased_cards" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_purchased_cards_profile" ON "purchased_cards" ("profile_id");

ALTER TABLE "purchased_cards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchased_cards" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "purchased_cards_owner_policy" ON "purchased_cards";
CREATE POLICY "purchased_cards_owner_policy" ON "purchased_cards"
  USING (
    "user_id" = current_setting('app.current_user_id', true)
    OR current_setting('app.is_admin', true) = 'true'
  )
  WITH CHECK (
    "user_id" = current_setting('app.current_user_id', true)
    OR current_setting('app.is_admin', true) = 'true'
  );
