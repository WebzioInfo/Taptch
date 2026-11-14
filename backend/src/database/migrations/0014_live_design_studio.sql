-- 0014_live_design_studio.sql
-- Live NFC Card Design Studio Database Tables

CREATE TABLE IF NOT EXISTS "card_products" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"slug" varchar(128) NOT NULL UNIQUE,
	"description" text NOT NULL,
	"base_price" real DEFAULT 1499 NOT NULL,
	"discount_price" real,
	"canvas_width" integer DEFAULT 1050 NOT NULL,
	"canvas_height" integer DEFAULT 600 NOT NULL,
	"safe_zone" integer DEFAULT 40 NOT NULL,
	"bleed_zone" integer DEFAULT 25 NOT NULL,
	"supported_sides" varchar(32) DEFAULT 'FRONT_AND_BACK' NOT NULL,
	"mockup_type" varchar(32) DEFAULT 'CARD_3D' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "card_product_variants" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"product_id" varchar(64) NOT NULL REFERENCES "card_products"("id") ON DELETE cascade,
	"name" varchar(128) NOT NULL,
	"color" varchar(32) DEFAULT '#121216' NOT NULL,
	"finish" varchar(64) DEFAULT 'matte' NOT NULL,
	"price" real DEFAULT 1499 NOT NULL,
	"sku" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "card_design_templates" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"category" varchar(64) DEFAULT 'Corporate' NOT NULL,
	"style" varchar(64) DEFAULT 'Minimal' NOT NULL,
	"preview_url" text NOT NULL,
	"front_artwork_url" text,
	"back_artwork_url" text,
	"front_canvas_json" text NOT NULL,
	"back_canvas_json" text,
	"is_global" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "card_product_templates" (
	"product_id" varchar(64) NOT NULL REFERENCES "card_products"("id") ON DELETE cascade,
	"template_id" varchar(64) NOT NULL REFERENCES "card_design_templates"("id") ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "card_designs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"product_id" varchar(64) NOT NULL REFERENCES "card_products"("id") ON DELETE cascade,
	"template_id" varchar(64) REFERENCES "card_design_templates"("id") ON DELETE set null,
	"variant_id" varchar(64) REFERENCES "card_product_variants"("id") ON DELETE set null,
	"name" varchar(128) DEFAULT 'Untitled NFC Card' NOT NULL,
	"front_canvas_json" text NOT NULL,
	"back_canvas_json" text,
	"preview_url" text,
	"back_preview_url" text,
	"is_draft" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cart_items" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"product_id" varchar(64) NOT NULL REFERENCES "card_products"("id") ON DELETE cascade,
	"variant_id" varchar(64) REFERENCES "card_product_variants"("id") ON DELETE set null,
	"design_id" varchar(64) REFERENCES "card_designs"("id") ON DELETE set null,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "order_items" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"order_id" varchar(64) NOT NULL REFERENCES "orders"("id") ON DELETE cascade,
	"product_id" varchar(64) NOT NULL REFERENCES "card_products"("id"),
	"product_name" varchar(128) NOT NULL,
	"variant_name" varchar(128),
	"unit_price" real NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total" real NOT NULL,
	"design_snapshot_json" text,
	"design_preview_url" text,
	"back_preview_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS "idx_card_designs_customer_id" ON "card_designs" ("customer_id");
CREATE INDEX IF NOT EXISTS "idx_card_designs_product_id" ON "card_designs" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_cart_items_customer_id" ON "cart_items" ("customer_id");
CREATE INDEX IF NOT EXISTS "idx_order_items_order_id" ON "order_items" ("order_id");

-- RLS Enforcement
ALTER TABLE "card_designs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cart_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;

