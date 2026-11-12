-- ====================================================================
-- TAPTCH MIGRATION 0010: INSTAGRAM NFC CARD CAMPAIGN
-- ====================================================================

CREATE TABLE IF NOT EXISTS "campaign_settings" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"campaign_key" varchar(64) NOT NULL UNIQUE,
	"title" varchar(255) NOT NULL,
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"support_whatsapp" varchar(32) DEFAULT '+919876543210' NOT NULL,
	"designer_whatsapp" varchar(32) DEFAULT '+919876543211' NOT NULL,
	"designer_fee" integer DEFAULT 200 NOT NULL,
	"standard_shipping_fee" integer DEFAULT 60 NOT NULL,
	"express_shipping_fee" integer DEFAULT 150 NOT NULL,
	"tax_rate_percent" numeric(5, 2) DEFAULT '18.00' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "campaign_products" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"campaign_key" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"slug" varchar(64) NOT NULL UNIQUE,
	"material" varchar(32) NOT NULL,
	"chip_type" varchar(32) DEFAULT 'NTAG216' NOT NULL,
	"description" text NOT NULL,
	"base_price" integer NOT NULL,
	"manufacturing_cost" integer DEFAULT 150 NOT NULL,
	"packaging_cost" integer DEFAULT 30 NOT NULL,
	"stock_available" integer DEFAULT 100 NOT NULL,
	"stock_reserved" integer DEFAULT 0 NOT NULL,
	"image_url" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "campaign_orders" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"order_number" varchar(32) NOT NULL UNIQUE,
	"barcode" varchar(64) NOT NULL UNIQUE,
	"campaign_key" varchar(64) DEFAULT 'instagram-card' NOT NULL,
	"user_id" text REFERENCES "public"."users"("id") ON DELETE set null,
	"customer_name" varchar(128) NOT NULL,
	"customer_email" varchar(255),
	"customer_phone" varchar(32) NOT NULL,
	"instagram_username" varchar(128) NOT NULL,
	"instagram_url" text NOT NULL,
	"shipping_address" jsonb NOT NULL,
	"product_id" varchar(64) NOT NULL REFERENCES "public"."campaign_products"("id"),
	"product_name" varchar(128) NOT NULL,
	"material" varchar(32) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"design_option" varchar(32) NOT NULL,
	"design_notes" text,
	"unit_price" integer NOT NULL,
	"customization_fee" integer DEFAULT 0 NOT NULL,
	"designer_fee" integer DEFAULT 0 NOT NULL,
	"shipping_fee" integer DEFAULT 0 NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"total_amount" integer NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"payment_status" varchar(32) DEFAULT 'UNPAID' NOT NULL,
	"design_status" varchar(32) DEFAULT 'DESIGN_PENDING' NOT NULL,
	"production_status" varchar(32) DEFAULT 'PENDING_PRODUCTION' NOT NULL,
	"shipping_status" varchar(32) DEFAULT 'NOT_SHIPPED' NOT NULL,
	"order_status" varchar(32) DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"courier_provider" varchar(64),
	"tracking_number" varchar(128),
	"dispatched_at" timestamp,
	"delivered_at" timestamp,
	"assigned_designer_id" text REFERENCES "public"."users"("id") ON DELETE set null,
	"designer_assigned_at" timestamp,
	"internal_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_campaign_orders_num" ON "campaign_orders" ("order_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_campaign_orders_barcode" ON "campaign_orders" ("barcode");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_campaign_orders_phone" ON "campaign_orders" ("customer_phone");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "campaign_designs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"order_id" varchar(64) NOT NULL REFERENCES "public"."campaign_orders"("id") ON DELETE cascade,
	"template_id" varchar(64) NOT NULL,
	"version_number" integer DEFAULT 1 NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"front_design_json" jsonb NOT NULL,
	"back_design_json" jsonb NOT NULL,
	"preview_front_url" text,
	"preview_back_url" text,
	"print_ready_artwork_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "campaign_payments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"order_id" varchar(64) NOT NULL REFERENCES "public"."campaign_orders"("id") ON DELETE cascade,
	"amount" integer NOT NULL,
	"payment_method" varchar(32) NOT NULL,
	"transaction_reference" varchar(128) NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"evidence_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_by" text REFERENCES "public"."users"("id") ON DELETE set null,
	"verified_at" timestamp,
	"internal_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_campaign_payments_ref" ON "campaign_payments" ("transaction_reference");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_campaign_payments_order" ON "campaign_payments" ("order_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "campaign_refunds" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"order_id" varchar(64) NOT NULL REFERENCES "public"."campaign_orders"("id") ON DELETE cascade,
	"payment_id" varchar(64) REFERENCES "public"."campaign_payments"("id") ON DELETE set null,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"refund_method" varchar(32) NOT NULL,
	"transaction_reference" varchar(128) NOT NULL,
	"authorized_by" text REFERENCES "public"."users"("id") ON DELETE set null NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "campaign_expenses" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"campaign_key" varchar(64) DEFAULT 'instagram-card' NOT NULL,
	"category" varchar(64) NOT NULL,
	"amount" integer NOT NULL,
	"expense_date" timestamp DEFAULT now() NOT NULL,
	"vendor" varchar(128) NOT NULL,
	"description" text NOT NULL,
	"transaction_reference" varchar(128),
	"receipt_url" text,
	"is_cogs" boolean DEFAULT true NOT NULL,
	"entered_by" text REFERENCES "public"."users"("id") ON DELETE set null NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "campaign_inventory_movements" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"product_id" varchar(64) NOT NULL REFERENCES "public"."campaign_products"("id") ON DELETE cascade,
	"movement_type" varchar(32) NOT NULL,
	"quantity" integer NOT NULL,
	"order_id" varchar(64) REFERENCES "public"."campaign_orders"("id") ON DELETE set null,
	"unit_cost" integer,
	"reason" text NOT NULL,
	"performed_by" text REFERENCES "public"."users"("id") ON DELETE set null,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "campaign_documents" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"order_id" varchar(64) NOT NULL REFERENCES "public"."campaign_orders"("id") ON DELETE cascade,
	"document_type" varchar(32) NOT NULL,
	"document_number" varchar(64) NOT NULL UNIQUE,
	"file_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"generated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

