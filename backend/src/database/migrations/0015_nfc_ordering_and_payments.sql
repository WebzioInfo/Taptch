-- 0015_nfc_ordering_and_payments.sql
-- NFC Card Ordering, Checkout, Payment Transactions, and Real-time Status History

-- 1. Alter orders table to add ordering, payment, and logistics fields safely
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_number" varchar(32);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" varchar(32) DEFAULT 'razorpay' NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_reference" varchar(128);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "profile_assistance_status" varchar(32) DEFAULT 'NOT_REQUIRED' NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "profile_assistance_notes" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "subtotal" real DEFAULT 0 NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_cost" real DEFAULT 0 NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tax_amount" real DEFAULT 0 NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "total_amount" real DEFAULT 0 NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "currency" varchar(8) DEFAULT 'INR' NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "courier_name" varchar(64);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_url" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "internal_notes" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(128);

-- Backfill existing orders with a unique order_number if null
UPDATE "orders" SET "order_number" = 'TAP-' || UPPER(SUBSTRING("id" FROM 1 FOR 8)) WHERE "order_number" IS NULL;
ALTER TABLE "orders" ALTER COLUMN "order_number" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_order_number_unique') THEN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_order_number_unique" UNIQUE ("order_number");
  END IF;
END $$;

-- 2. Create order status history timeline table
CREATE TABLE IF NOT EXISTS "order_status_history" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"order_id" varchar(64) NOT NULL REFERENCES "orders"("id") ON DELETE cascade,
	"status" varchar(32) NOT NULL,
	"title" varchar(128) NOT NULL,
	"description" text,
	"updated_by" text DEFAULT 'system',
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Index order status history by order_id for sub-millisecond timeline retrieval
CREATE INDEX IF NOT EXISTS "idx_order_status_history_order" ON "order_status_history" ("order_id", "created_at");

-- 3. Create discrete payments table
CREATE TABLE IF NOT EXISTS "payments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"order_id" varchar(64) NOT NULL REFERENCES "orders"("id") ON DELETE cascade,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"payment_method" varchar(32) NOT NULL,
	"amount" real NOT NULL,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"status" varchar(32) DEFAULT 'PENDING' NOT NULL,
	"gateway_order_id" varchar(128),
	"gateway_payment_id" varchar(128),
	"gateway_signature" text,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_payments_order" ON "payments" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_payments_user" ON "payments" ("user_id");
