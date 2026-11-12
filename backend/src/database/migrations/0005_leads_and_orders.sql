-- 0005_leads_and_orders.sql
CREATE TABLE IF NOT EXISTS "leads" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"profile_id" varchar(64) NOT NULL REFERENCES "profiles"("id") ON DELETE cascade,
	"name" varchar(128) NOT NULL,
	"email" varchar(255),
	"phone" varchar(32),
	"company" varchar(128),
	"job_title" varchar(128),
	"notes" text,
	"source" varchar(32) DEFAULT 'profile_exchange' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "orders" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"profile_id" varchar(64) REFERENCES "profiles"("id") ON DELETE set null,
	"material" varchar(32) DEFAULT 'pvc' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"shipping_address" jsonb NOT NULL,
	"order_status" varchar(32) DEFAULT 'requested' NOT NULL,
	"payment_status" varchar(32) DEFAULT 'unpaid' NOT NULL,
	"tracking_number" varchar(128),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- RLS policies
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_profile_owner_access'
  ) THEN
    CREATE POLICY "leads_profile_owner_access" ON "leads"
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM "profiles"
          WHERE "profiles"."id" = "leads"."profile_id"
          AND "profiles"."owner_id" = current_setting('app.current_user_id', true)
        )
        OR current_setting('app.is_admin', true) = 'true'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_public_insert'
  ) THEN
    CREATE POLICY "leads_public_insert" ON "leads"
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_owner_isolation'
  ) THEN
    CREATE POLICY "orders_owner_isolation" ON "orders"
      FOR ALL
      USING (
        "orders"."user_id" = current_setting('app.current_user_id', true)
        OR current_setting('app.is_admin', true) = 'true'
      );
  END IF;
END $$;
