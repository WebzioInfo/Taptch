-- 0033: Issue Card to User — owner_user_id NOT NULL, url_id, issued_by/at, note, unique indexes, order_type

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_type VARCHAR(32) NOT NULL DEFAULT 'standard';

ALTER TABLE purchased_cards
  ADD COLUMN IF NOT EXISTS url_id VARCHAR(32),
  ADD COLUMN IF NOT EXISTS issued_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS note TEXT;

ALTER TABLE purchased_cards
  ALTER COLUMN user_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchased_cards_card_code
  ON purchased_cards (card_code) WHERE card_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchased_cards_url_id
  ON purchased_cards (url_id) WHERE url_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchased_cards_chip_uid
  ON purchased_cards (chip_uid) WHERE chip_uid IS NOT NULL;
