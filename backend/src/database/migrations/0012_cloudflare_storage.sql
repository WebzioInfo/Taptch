-- Cloudflare Storage Architecture Migration
-- Adds provider-neutral storage columns to media_assets
-- Relaxes Cloudinary-specific constraints while preserving historical records

ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "storage_provider" varchar(32) DEFAULT 'cloudflare_images' NOT NULL;
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "storage_key" varchar(255);
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "storage_object_id" varchar(255);
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "asset_url" text;
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "asset_type" varchar(32) DEFAULT 'image' NOT NULL;
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "mime_type" varchar(100);
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT true NOT NULL;

-- Make cloudinary_public_id nullable for new Cloudflare uploads
ALTER TABLE "media_assets" ALTER COLUMN "cloudinary_public_id" DROP NOT NULL;

-- Backfill existing records with Cloudflare-compatible values
UPDATE "media_assets" 
SET 
  "storage_key" = COALESCE("storage_key", "cloudinary_public_id"),
  "storage_object_id" = COALESCE("storage_object_id", "cloudinary_public_id"),
  "asset_url" = COALESCE("asset_url", "secure_url"),
  "asset_type" = COALESCE("asset_type", CASE WHEN "resource_type" = 'raw' THEN 'document' ELSE "resource_type" END)
WHERE "storage_key" IS NULL;

-- Create index on storage_key for fast lookups
CREATE INDEX IF NOT EXISTS "idx_media_assets_storage_key" ON "media_assets" ("storage_key");
CREATE INDEX IF NOT EXISTS "idx_media_assets_storage_provider" ON "media_assets" ("storage_provider");
