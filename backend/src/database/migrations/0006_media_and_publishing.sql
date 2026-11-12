-- 0006_media_and_publishing.sql
-- Cloudinary Media Assets, Profile Publication Requests, and Plan Assignment History

-- 1. Media Assets (Cloudinary Tracking)
CREATE TABLE IF NOT EXISTS media_assets (
  id VARCHAR(64) PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id VARCHAR(64) REFERENCES profiles(id) ON DELETE SET NULL,
  business_id VARCHAR(64) REFERENCES profile_businesses(id) ON DELETE SET NULL,
  resource_type VARCHAR(32) NOT NULL DEFAULT 'image',
  media_category VARCHAR(64) NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL UNIQUE,
  secure_url TEXT NOT NULL,
  format VARCHAR(32),
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  visibility_status VARCHAR(32) NOT NULL DEFAULT 'public',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON media_assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_profile ON media_assets(profile_id);

-- 2. Complete Profile Data Collection Columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(32);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS achievements JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS videos JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brochures JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}';

-- 3. Subscription Validity & Manual Payment Tracking
ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) NOT NULL DEFAULT 'NOT_RECORDED';
ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS amount_inr TEXT;
ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP;

-- 4. Publication Requests Table
CREATE TABLE IF NOT EXISTS publication_requests (
  id VARCHAR(64) PRIMARY KEY,
  profile_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING_PUBLICATION',
  requested_plan_id VARCHAR(64) REFERENCES plans(id),
  admin_notes TEXT,
  rejection_reason TEXT,
  corrections_requested TEXT,
  customer_contact_phone VARCHAR(32),
  customer_contact_whatsapp VARCHAR(32),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pub_requests_user ON publication_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pub_requests_status ON publication_requests(status);
CREATE INDEX IF NOT EXISTS idx_pub_requests_profile ON publication_requests(profile_id);

-- 5. Plan Assignment & Payment Audit Log Table
CREATE TABLE IF NOT EXISTS plan_assignment_history (
  id VARCHAR(64) PRIMARY KEY,
  subscription_id VARCHAR(64),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_plan_id VARCHAR(64),
  to_plan_id VARCHAR(64) NOT NULL,
  assigned_by TEXT NOT NULL REFERENCES users(id),
  action VARCHAR(64) NOT NULL,
  payment_status VARCHAR(32) NOT NULL DEFAULT 'NOT_RECORDED',
  amount_inr TEXT,
  valid_until TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_history_user ON plan_assignment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_history_action ON plan_assignment_history(action);

-- Enable RLS
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE publication_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_assignment_history ENABLE ROW LEVEL SECURITY;

