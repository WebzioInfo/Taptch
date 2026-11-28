-- Migration 0031: Profiles soft-delete deleted_at column, partial unique slug index, and active_profiles view

ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;

UPDATE "profiles"
SET "deleted_at" = COALESCE("updated_at", now())
WHERE upper("status") = 'DELETED'
  AND "deleted_at" IS NULL;

-- Replace global unique constraint on slug with a partial unique index for active profiles only
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_slug_unique";
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_slug_key";
DROP INDEX IF EXISTS "profiles_slug_unique";
DROP INDEX IF EXISTS "idx_profiles_slug_active";

CREATE UNIQUE INDEX "idx_profiles_slug_active"
  ON "profiles" ("slug")
  WHERE "deleted_at" IS NULL;

-- Database view for active profiles (opt-in required to read deleted rows)
CREATE OR REPLACE VIEW "active_profiles" AS
  SELECT *
  FROM "profiles"
  WHERE upper("status") <> 'DELETED'
    AND "deleted_at" IS NULL;
