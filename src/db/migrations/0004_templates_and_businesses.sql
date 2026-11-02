CREATE TABLE "profile_businesses" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"profile_id" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"tagline" varchar(255),
	"logo_url" text,
	"cover_url" text,
	"description" text,
	"website" varchar(255),
	"email" varchar(255),
	"phone" varchar(32),
	"whatsapp" varchar(32),
	"address" text,
	"google_maps_url" text,
	"google_review_url" text,
	"brochure_url" text,
	"social_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_catalogue_items" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"profile_id" varchar(64) NOT NULL,
	"business_id" varchar(64),
	"type" varchar(32) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"price" varchar(64),
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"image_url" text,
	"action_url" text,
	"action_label" varchar(64) DEFAULT 'Enquire' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_sections" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"profile_id" varchar(64) NOT NULL,
	"section_type" varchar(64) NOT NULL,
	"title" varchar(128),
	"is_enabled" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"config_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(64) NOT NULL,
	"thumbnail_url" text NOT NULL,
	"supported_profile_types" jsonb DEFAULT '["personal","business"]'::jsonb NOT NULL,
	"required_plan_id" varchar(32) DEFAULT 'nano' NOT NULL,
	"default_theme_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "profile_type" varchar(32) DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "template_id" varchar(64) DEFAULT 'obsidian-luxury' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "theme_config" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_businesses" ADD CONSTRAINT "profile_businesses_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_catalogue_items" ADD CONSTRAINT "profile_catalogue_items_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_catalogue_items" ADD CONSTRAINT "profile_catalogue_items_business_id_profile_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."profile_businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_sections" ADD CONSTRAINT "profile_sections_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Enable RLS on new tables
ALTER TABLE "profile_businesses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profile_catalogue_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profile_sections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "templates" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "templates_public_read" ON "templates" FOR SELECT USING (is_active = true OR current_setting('app.is_admin', true) = 'true');
--> statement-breakpoint
CREATE POLICY "templates_admin_write" ON "templates" FOR ALL USING (current_setting('app.is_admin', true) = 'true');
--> statement-breakpoint
CREATE POLICY "profile_businesses_owner_all" ON "profile_businesses" FOR ALL USING (
  profile_id IN (SELECT id FROM profiles WHERE owner_id = current_setting('app.current_user_id', true))
  OR current_setting('app.is_admin', true) = 'true'
);
--> statement-breakpoint
CREATE POLICY "profile_businesses_public_read" ON "profile_businesses" FOR SELECT USING (
  profile_id IN (SELECT id FROM profiles WHERE status = 'published')
);
--> statement-breakpoint
CREATE POLICY "profile_catalogue_owner_all" ON "profile_catalogue_items" FOR ALL USING (
  profile_id IN (SELECT id FROM profiles WHERE owner_id = current_setting('app.current_user_id', true))
  OR current_setting('app.is_admin', true) = 'true'
);
--> statement-breakpoint
CREATE POLICY "profile_catalogue_public_read" ON "profile_catalogue_items" FOR SELECT USING (
  profile_id IN (SELECT id FROM profiles WHERE status = 'published')
);
--> statement-breakpoint
CREATE POLICY "profile_sections_owner_all" ON "profile_sections" FOR ALL USING (
  profile_id IN (SELECT id FROM profiles WHERE owner_id = current_setting('app.current_user_id', true))
  OR current_setting('app.is_admin', true) = 'true'
);
--> statement-breakpoint
CREATE POLICY "profile_sections_public_read" ON "profile_sections" FOR SELECT USING (
  profile_id IN (SELECT id FROM profiles WHERE status = 'published')
);
