-- 0007_dynamic_qr_engine.sql
-- Taptch Dynamic QR Engine, Batch Inventory, and Scan Telemetry

-- 1. QR Batches Table
CREATE TABLE IF NOT EXISTS qr_batches (
  id VARCHAR(64) PRIMARY KEY,
  batch_code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  quantity INTEGER NOT NULL,
  qr_type VARCHAR(32) NOT NULL DEFAULT 'dynamic',
  destination_category VARCHAR(32) NOT NULL DEFAULT 'profile',
  product_type VARCHAR(32) NOT NULL DEFAULT 'sticker',
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_batches_org ON qr_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_qr_batches_code ON qr_batches(batch_code);

-- 2. QR Codes Table
CREATE TABLE IF NOT EXISTS qr_codes (
  id VARCHAR(64) PRIMARY KEY,
  serial_number VARCHAR(64) NOT NULL UNIQUE,
  token VARCHAR(32) NOT NULL UNIQUE,
  batch_id VARCHAR(64) REFERENCES qr_batches(id) ON DELETE SET NULL,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  card_id VARCHAR(64) REFERENCES cards(id) ON DELETE SET NULL,
  destination_type VARCHAR(32) NOT NULL DEFAULT 'profile',
  profile_id VARCHAR(64) REFERENCES profiles(id) ON DELETE SET NULL,
  target_url TEXT,
  destination_payload TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'available',
  is_dynamic BOOLEAN NOT NULL DEFAULT TRUE,
  design_config TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMP,
  verified_by TEXT REFERENCES users(id),
  activated_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON qr_codes(token);
CREATE INDEX IF NOT EXISTS idx_qr_codes_serial ON qr_codes(serial_number);
CREATE INDEX IF NOT EXISTS idx_qr_codes_batch ON qr_codes(batch_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_owner ON qr_codes(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_org ON qr_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON qr_codes(status);

-- 3. QR Scan Events Table (Telemetry)
CREATE TABLE IF NOT EXISTS qr_scan_events (
  id VARCHAR(64) PRIMARY KEY,
  qr_id VARCHAR(64) NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  profile_id VARCHAR(64) REFERENCES profiles(id) ON DELETE SET NULL,
  destination_type VARCHAR(32) NOT NULL,
  resolved_url TEXT NOT NULL,
  device_category VARCHAR(32),
  browser VARCHAR(32),
  os VARCHAR(32),
  country VARCHAR(8),
  city VARCHAR(64),
  referrer TEXT,
  visitor_hash VARCHAR(64) NOT NULL,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_scan_events_qr ON qr_scan_events(qr_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_events_profile ON qr_scan_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_events_created ON qr_scan_events(created_at);

-- 4. Row-Level Security (RLS)
ALTER TABLE qr_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_batches FORCE ROW LEVEL SECURITY;

CREATE POLICY qr_batches_admin_all ON qr_batches
    FOR ALL
    USING (current_setting('app.is_admin', true) = 'true');

CREATE POLICY qr_batches_org_read ON qr_batches
    FOR SELECT
    USING (organization_id = current_setting('app.current_org_id', true));

CREATE POLICY qr_batches_org_write ON qr_batches
    FOR ALL
    USING (
        organization_id = current_setting('app.current_org_id', true)
        AND current_setting('app.current_role', true) IN ('owner', 'admin')
    );

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes FORCE ROW LEVEL SECURITY;

CREATE POLICY qr_codes_admin_all ON qr_codes
    FOR ALL
    USING (current_setting('app.is_admin', true) = 'true');

CREATE POLICY qr_codes_owner_all ON qr_codes
    FOR ALL
    USING (owner_user_id = current_setting('app.current_user_id', true));

CREATE POLICY qr_codes_org_read ON qr_codes
    FOR SELECT
    USING (organization_id = current_setting('app.current_org_id', true));

CREATE POLICY qr_codes_public_read ON qr_codes
    FOR SELECT
    USING (status IN ('active', 'available'));

ALTER TABLE qr_scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_events FORCE ROW LEVEL SECURITY;

CREATE POLICY qr_scan_events_admin_all ON qr_scan_events
    FOR ALL
    USING (current_setting('app.is_admin', true) = 'true');

CREATE POLICY qr_scan_events_insert_all ON qr_scan_events
    FOR INSERT
    WITH CHECK (true);

