-- 0035: Drop per-card feature_flags and custom_destination_url
-- NOTE: Review and confirm before running.

ALTER TABLE purchased_cards
  DROP COLUMN IF EXISTS feature_flags,
  DROP COLUMN IF EXISTS custom_destination_url;
