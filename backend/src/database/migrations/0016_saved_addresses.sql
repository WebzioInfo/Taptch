-- 0016_saved_addresses.sql
-- User Saved Addresses for Fast Checkout and Multi-Address Management

CREATE TABLE IF NOT EXISTS "saved_addresses" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "label" varchar(32) DEFAULT 'Home' NOT NULL,
  "custom_label" varchar(64),
  "recipient_name" varchar(128) NOT NULL,
  "phone" varchar(32) NOT NULL,
  "email" varchar(128),
  "whatsapp_number" varchar(32),
  "address_line1" text NOT NULL,
  "address_line2" text,
  "city" varchar(64) NOT NULL,
  "state" varchar(64) NOT NULL,
  "postal_code" varchar(16) NOT NULL,
  "delivery_instructions" text,
  "is_default" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "last_used_at" timestamp
);

CREATE INDEX IF NOT EXISTS "idx_saved_addresses_user" ON "saved_addresses" ("user_id", "is_default", "last_used_at");
