-- 0018_design_studio_seeds_and_rls.sql
-- 1. Row-Level Security Policies for card_designs & cart_items
-- 2. Seed starter card_products, card_product_variants, and card_design_templates

-- Enable RLS (idempotent)
ALTER TABLE IF EXISTS "card_designs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "cart_items" ENABLE ROW LEVEL SECURITY;

-- card_designs RLS policy: strictly isolated to the authenticated customer or admin
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'card_designs' AND policyname = 'card_designs_owner_access'
  ) THEN
    CREATE POLICY "card_designs_owner_access" ON "card_designs"
      FOR ALL
      USING (
        "customer_id" = current_setting('app.current_user_id', true)
        OR current_setting('app.is_admin', true) = 'true'
      )
      WITH CHECK (
        "customer_id" = current_setting('app.current_user_id', true)
        OR current_setting('app.is_admin', true) = 'true'
      );
  END IF;
END $$;

-- cart_items RLS policy: strictly isolated to the authenticated customer or admin
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cart_items' AND policyname = 'cart_items_owner_access'
  ) THEN
    CREATE POLICY "cart_items_owner_access" ON "cart_items"
      FOR ALL
      USING (
        "customer_id" = current_setting('app.current_user_id', true)
        OR current_setting('app.is_admin', true) = 'true'
      )
      WITH CHECK (
        "customer_id" = current_setting('app.current_user_id', true)
        OR current_setting('app.is_admin', true) = 'true'
      );
  END IF;
END $$;

-- Seed starter card_products
INSERT INTO "card_products" (
  "id", "name", "slug", "description", "base_price", "canvas_width", "canvas_height", "safe_zone", "bleed_zone", "supported_sides", "mockup_type", "is_active"
) VALUES 
  ('prod_classic_pvc', 'Classic White PVC NFC Card', 'classic-white-pvc-nfc-card', 'Crisp white matte finish premium PVC smart contactless card with high-performance NTAG213 microchip.', 1499, 1050, 600, 40, 25, 'FRONT_AND_BACK', 'CARD_3D', true),
  ('prod_matte_obsidian', 'Obsidian Matte Black NFC Card', 'obsidian-matte-black-nfc-card', 'Deep obsidian charcoal velvet-touch smart card featuring precision gold contactless foil and NTAG213 chip.', 1499, 1050, 600, 40, 25, 'FRONT_AND_BACK', 'CARD_3D', true),
  ('prod_matte_pvc_01', 'Matte Charcoal PVC NFC Card', 'matte-charcoal-nfc-card', 'Precision matte finish PVC smart business card with NTAG213 contactless chip.', 1499, 1050, 600, 40, 25, 'FRONT_AND_BACK', 'CARD_3D', true),
  ('prod_brushed_metal', 'Executive Brushed Metal Card', 'executive-brushed-metal-card', 'CNC-machined aerospace grade titanium and steel alloy contactless executive card with laser engraving.', 2499, 1050, 600, 40, 25, 'FRONT_AND_BACK', 'CARD_3D', true),
  ('prod_handcrafted_wood', 'Handcrafted Wood NFC Card', 'handcrafted-wood-nfc-card', 'Authentic dark walnut and bamboo eco-luxe smart card with laser-etched circuitry.', 1999, 1050, 600, 40, 25, 'FRONT_AND_BACK', 'CARD_3D', true)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "base_price" = EXCLUDED."base_price",
  "is_active" = EXCLUDED."is_active";

-- Seed starter card_product_variants
INSERT INTO "card_product_variants" ("id", "product_id", "name", "color", "finish", "price", "sku") VALUES
  ('var_white_matte', 'prod_classic_pvc', 'Bright White Matte', '#FAF8F5', 'matte', 1499, 'SKU-PVC-WHT-MAT'),
  ('var_white_gloss', 'prod_classic_pvc', 'Reflective Gloss', '#FFFFFF', 'gloss', 1499, 'SKU-PVC-WHT-GLS'),
  ('var_matte_black', 'prod_matte_obsidian', 'Matte Charcoal Black', '#0A0A0C', 'matte', 1499, 'SKU-PVC-OBS-MAT'),
  ('var_gold_accent', 'prod_matte_obsidian', 'Brushed Metallic Gold Accent', '#D4AF37', 'metallic', 1799, 'SKU-PVC-OBS-GLD'),
  ('var_obsidian', 'prod_matte_pvc_01', 'Obsidian Matte', '#121216', 'matte', 1499, 'SKU-PVC-MAT-01'),
  ('var_gold', 'prod_matte_pvc_01', 'Brushed Gold Accent', '#D4AF37', 'metallic', 1799, 'SKU-PVC-GLD-01'),
  ('var_raw_steel', 'prod_brushed_metal', 'Raw Stainless Steel', '#C4C4CC', 'brushed', 2499, 'SKU-MET-STL-RAW'),
  ('var_black_titanium', 'prod_brushed_metal', 'Matte Black Titanium', '#16161B', 'pvd', 2999, 'SKU-MET-TTN-BLK'),
  ('var_dark_walnut', 'prod_handcrafted_wood', 'Dark Walnut Finish', '#3E2723', 'woodgrain', 1999, 'SKU-WOD-WLN-01'),
  ('var_natural_bamboo', 'prod_handcrafted_wood', 'Natural Bamboo Finish', '#D7CCC8', 'woodgrain', 1999, 'SKU-WOD-BMB-01')
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "price" = EXCLUDED."price";

-- Seed starter card_design_templates
INSERT INTO "card_design_templates" (
  "id", "name", "category", "style", "preview_url", "front_canvas_json", "back_canvas_json", "is_global"
) VALUES (
  'tpl_executive_obsidian',
  'Obsidian Executive',
  'Corporate',
  'Luxury Minimal',
  '/branding/cards/default-card-preview.png',
  '{"version":"5.3.0","backgroundColor":"#0A0A0C","objects":[{"type":"rect","left":0,"top":0,"width":1050,"height":600,"fill":"#0A0A0C","selectable":false,"evented":false,"id":"bg_plate"}]}',
  '{"version":"5.3.0","backgroundColor":"#0A0A0C","objects":[{"type":"rect","left":0,"top":0,"width":1050,"height":600,"fill":"#0A0A0C","selectable":false,"evented":false,"id":"bg_plate"}]}',
  true
) ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "front_canvas_json" = EXCLUDED."front_canvas_json";
