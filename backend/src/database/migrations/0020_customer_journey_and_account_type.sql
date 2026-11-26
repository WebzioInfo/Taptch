-- Migration 0020: Customer Account Type, Card-to-Profile Association, Order Item Relations, & Purchase Journeys

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_type" varchar(32);

ALTER TABLE "card_designs" ADD COLUMN IF NOT EXISTS "profile_id" varchar(64) REFERENCES "profiles"("id") ON DELETE SET NULL;

ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "profile_id" varchar(64) REFERENCES "profiles"("id") ON DELETE SET NULL;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "design_id" varchar(64) REFERENCES "card_designs"("id") ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "purchase_journeys" (
  "id" varchar(64) PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "stage" varchar(48) NOT NULL DEFAULT 'ACCOUNT_SETUP',
  "account_type" varchar(32),
  "selected_product_id" varchar(64),
  "selected_variant_id" varchar(64),
  "selected_card_template_id" varchar(64),
  "selected_profile_template_id" varchar(64),
  "profile_id" varchar(64) REFERENCES "profiles"("id") ON DELETE SET NULL,
  "design_id" varchar(64) REFERENCES "card_designs"("id") ON DELETE SET NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  "order_id" varchar(64) REFERENCES "orders"("id") ON DELETE SET NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_purchase_journeys_user" ON "purchase_journeys" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_card_designs_profile" ON "card_designs" ("profile_id");
CREATE INDEX IF NOT EXISTS "idx_order_items_profile" ON "order_items" ("profile_id");

ALTER TABLE "purchase_journeys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_journeys" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "purchase_journeys_owner_policy" ON "purchase_journeys";
CREATE POLICY "purchase_journeys_owner_policy" ON "purchase_journeys"
  USING (
    "user_id" = current_setting('app.current_user_id', true)
    OR current_setting('app.is_admin', true) = 'true'
  )
  WITH CHECK (
    "user_id" = current_setting('app.current_user_id', true)
    OR current_setting('app.is_admin', true) = 'true'
  );
