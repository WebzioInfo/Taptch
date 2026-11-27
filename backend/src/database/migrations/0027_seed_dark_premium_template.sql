-- Idempotent seed for the shared public Dark Premium template (Personal & Business)
-- Touches no existing rows.

INSERT INTO "templates" (
  "id",
  "name",
  "slug",
  "description",
  "category",
  "thumbnail_url",
  "supported_profile_types",
  "required_plan_id",
  "default_theme_config",
  "is_featured",
  "is_active",
  "display_order"
)
VALUES (
  'dark-premium',
  'Dark Premium',
  'dark-premium',
  'Near-black architectural layout with restrained champagne accent, bold typography, high contrast, and generous spacing for personal and business profiles.',
  'luxury',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
  '["personal","business"]'::jsonb,
  'nano',
  '{"primary":"#C5A880","secondary":"#D8BD96","accent":"#C5A880","background":"#08090A","cardBackground":"#121316","surface":"#1A1C20","text":"#F4F4F6","heading":"#F4F4F6","buttonBackground":"#C5A880","buttonText":"#0C0D0E","border":"#22252A"}'::jsonb,
  true,
  true,
  2
)
ON CONFLICT ("id") DO NOTHING;
