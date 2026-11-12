-- 0009_organization_staff_management.sql
-- Adds granular status, permissions, responsibilities to members and invitations tables.

ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "status" varchar(32) DEFAULT 'active' NOT NULL;
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "permissions" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "assigned_responsibilities" text;
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "phone_number" varchar(32);
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "permissions" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
