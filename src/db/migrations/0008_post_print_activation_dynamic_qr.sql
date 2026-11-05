-- 0008_post_print_activation_dynamic_qr.sql
-- Enterprise Post-Print Activation Dynamic QR, Groups, Field Staff RBAC & Calendar Telemetry

-- 1. QR Categories Table
CREATE TABLE IF NOT EXISTS qr_categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  slug VARCHAR(128) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. QR Groups Table
CREATE TABLE IF NOT EXISTS qr_groups (
  id VARCHAR(64) PRIMARY KEY,
  label VARCHAR(128) NOT NULL,
  qr_count INTEGER NOT NULL DEFAULT 0,
  category_id VARCHAR(64) REFERENCES qr_categories(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Enhance qr_batches Table
ALTER TABLE qr_batches ADD COLUMN IF NOT EXISTS start_from INTEGER NOT NULL DEFAULT 1;
ALTER TABLE qr_batches ADD COLUMN IF NOT EXISTS param_name VARCHAR(64);
ALTER TABLE qr_batches ADD COLUMN IF NOT EXISTS value_prefix VARCHAR(64);
ALTER TABLE qr_batches ADD COLUMN IF NOT EXISTS sep VARCHAR(16);
ALTER TABLE qr_batches ADD COLUMN IF NOT EXISTS template_url TEXT;
ALTER TABLE qr_batches ADD COLUMN IF NOT EXISTS group_id VARCHAR(64) REFERENCES qr_groups(id) ON DELETE SET NULL;

-- 4. Enhance qr_codes Table
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS label VARCHAR(120);
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS group_id VARCHAR(64) REFERENCES qr_groups(id) ON DELETE SET NULL;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS batch_label VARCHAR(128);
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS batch_size INTEGER;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS batch_sequence INTEGER;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS qr_type VARCHAR(32) NOT NULL DEFAULT 'single';
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS manual_redirect_url TEXT;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS id_value VARCHAR(64);
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS last_reassigned_at TIMESTAMP;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS scan_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMP;

-- 5. Enhance users Table
ALTER TABLE users ADD COLUMN IF NOT EXISTS place VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business VARCHAR(255);

-- 6. Indexes for High-Speed Lookups & Calendar Heatmap Aggregations
CREATE INDEX IF NOT EXISTS idx_qr_codes_assigned_at ON qr_codes(assigned_at);
CREATE INDEX IF NOT EXISTS idx_qr_codes_assigned_by ON qr_codes(assigned_by);
CREATE INDEX IF NOT EXISTS idx_qr_codes_group_id ON qr_codes(group_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_id_value ON qr_codes(id_value);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(phone_number);

-- 7. RLS for Groups & Categories
ALTER TABLE qr_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_categories FORCE ROW LEVEL SECURITY;

CREATE POLICY qr_categories_all_read ON qr_categories
    FOR SELECT
    USING (true);

CREATE POLICY qr_categories_admin_write ON qr_categories
    FOR ALL
    USING (current_setting('app.is_admin', true) = 'true');

ALTER TABLE qr_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_groups FORCE ROW LEVEL SECURITY;

CREATE POLICY qr_groups_all_read ON qr_groups
    FOR SELECT
    USING (true);

CREATE POLICY qr_groups_admin_all ON qr_groups
    FOR ALL
    USING (current_setting('app.is_admin', true) = 'true');

