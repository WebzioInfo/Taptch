CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "material" varchar(32) NOT NULL UNIQUE,
  "sku" varchar(64) NOT NULL UNIQUE,
  "available_qty" integer DEFAULT 0 NOT NULL,
  "reserved_qty" integer DEFAULT 0 NOT NULL,
  "sold_qty" integer DEFAULT 0 NOT NULL,
  "damaged_qty" integer DEFAULT 0 NOT NULL,
  "low_stock_threshold" integer DEFAULT 20 NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "inventory_movements" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "inventory_item_id" varchar(64) NOT NULL REFERENCES "inventory_items"("id") ON DELETE CASCADE,
  "movement_type" varchar(32) NOT NULL,
  "quantity_delta" integer NOT NULL,
  "reason" text NOT NULL,
  "idempotency_key" varchar(128),
  "actor_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_inventory_movements_idempotency" ON "inventory_movements" ("idempotency_key");
CREATE INDEX IF NOT EXISTS "idx_inventory_movements_item" ON "inventory_movements" ("inventory_item_id");

CREATE TABLE IF NOT EXISTS "admin_alerts" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "alert_type" varchar(64) NOT NULL,
  "severity" varchar(16) DEFAULT 'WARNING' NOT NULL,
  "dedupe_key" varchar(128) NOT NULL,
  "title" varchar(255) NOT NULL,
  "message" text NOT NULL,
  "resource_type" varchar(64),
  "resource_id" varchar(64),
  "status" varchar(24) DEFAULT 'ACTIVE' NOT NULL,
  "is_read" boolean DEFAULT false NOT NULL,
  "resolved_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "resolved_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_admin_alerts_dedupe" ON "admin_alerts" ("dedupe_key", "status");

CREATE TABLE IF NOT EXISTS "admin_login_history" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "email" varchar(255) NOT NULL,
  "ip_address" varchar(64),
  "user_agent" text,
  "success" boolean DEFAULT false NOT NULL,
  "failure_reason" varchar(128),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_admin_login_history_user" ON "admin_login_history" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_admin_login_history_created" ON "admin_login_history" ("created_at");
