ALTER TABLE "campaign_orders" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(128);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_campaign_orders_idempotency" ON "campaign_orders" ("idempotency_key");

