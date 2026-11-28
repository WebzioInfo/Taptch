-- 0032: Card status lock metadata, blocked scan attempts, and user in-app notifications

ALTER TABLE purchased_cards
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS status_changed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status_reason TEXT;

CREATE TABLE IF NOT EXISTS blocked_card_scans (
  id VARCHAR(64) PRIMARY KEY,
  card_id VARCHAR(64) NOT NULL,
  card_status VARCHAR(32) NOT NULL,
  device_category VARCHAR(32),
  country VARCHAR(64),
  city VARCHAR(64),
  visitor_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_card_scans_card_created
  ON blocked_card_scans (card_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  resource_type VARCHAR(64),
  resource_id VARCHAR(64),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user
  ON user_notifications (user_id, is_read);
