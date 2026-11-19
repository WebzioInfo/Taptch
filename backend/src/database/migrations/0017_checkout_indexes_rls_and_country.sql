-- 0017_checkout_indexes_rls_and_country.sql
-- Country field on saved_addresses, unique idempotency index on orders, and strict multi-tenant RLS policies

-- 1. Country column on saved_addresses
ALTER TABLE "saved_addresses" ADD COLUMN IF NOT EXISTS "country" varchar(64) DEFAULT 'India' NOT NULL;

-- 2. Scoped unique index on orders (user_id, idempotency_key) to guarantee idempotency and prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS "idx_orders_user_idempotency" 
ON "orders" ("user_id", "idempotency_key") 
WHERE "idempotency_key" IS NOT NULL;

-- 3. Row-Level Security for saved_addresses
ALTER TABLE "saved_addresses" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'saved_addresses' AND policyname = 'saved_addresses_owner_access'
  ) THEN
    CREATE POLICY "saved_addresses_owner_access" ON "saved_addresses"
      FOR ALL
      USING (
        "user_id" = current_setting('app.current_user_id', true)
        OR current_setting('app.is_admin', true) = 'true'
      )
      WITH CHECK (
        "user_id" = current_setting('app.current_user_id', true)
        OR current_setting('app.is_admin', true) = 'true'
      );
  END IF;
END $$;

-- 4. Row-Level Security for order_items
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'order_items_owner_access'
  ) THEN
    CREATE POLICY "order_items_owner_access" ON "order_items"
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM "orders"
          WHERE "orders"."id" = "order_items"."order_id"
          AND (
            "orders"."user_id" = current_setting('app.current_user_id', true)
            OR current_setting('app.is_admin', true) = 'true'
          )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM "orders"
          WHERE "orders"."id" = "order_items"."order_id"
          AND (
            "orders"."user_id" = current_setting('app.current_user_id', true)
            OR current_setting('app.is_admin', true) = 'true'
          )
        )
      );
  END IF;
END $$;

-- 5. Row-Level Security for order_status_history
ALTER TABLE "order_status_history" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_status_history' AND policyname = 'order_status_history_owner_access'
  ) THEN
    CREATE POLICY "order_status_history_owner_access" ON "order_status_history"
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM "orders"
          WHERE "orders"."id" = "order_status_history"."order_id"
          AND (
            "orders"."user_id" = current_setting('app.current_user_id', true)
            OR current_setting('app.is_admin', true) = 'true'
          )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM "orders"
          WHERE "orders"."id" = "order_status_history"."order_id"
          AND (
            "orders"."user_id" = current_setting('app.current_user_id', true)
            OR current_setting('app.is_admin', true) = 'true'
          )
        )
      );
  END IF;
END $$;

-- 6. Row-Level Security for payments
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'payments_owner_access'
  ) THEN
    CREATE POLICY "payments_owner_access" ON "payments"
      FOR ALL
      USING (
        "user_id" = current_setting('app.current_user_id', true)
        OR current_setting('app.is_admin', true) = 'true'
      )
      WITH CHECK (
        "user_id" = current_setting('app.current_user_id', true)
        OR current_setting('app.is_admin', true) = 'true'
      );
  END IF;
END $$;
