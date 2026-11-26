-- Migration 0025: Username-Based NFC Profile URL Architecture
-- 
-- Context:
--   - profiles.slug IS the public username (already unique, already reserved-word-validated)
--   - NFC chip URL changes from /p/{redirectToken} to /{slug} (the profile username)
--   - Remove custom_url destination support from purchased_cards
--   - Add username_locked column to prevent slug changes after NFC assignment
--   - Add username format CHECK constraint (lowercase letters, numbers, hyphens, 3-32 chars)
--   - Add legacy_redirect_token index for backward compatibility with existing /p/ and /b/ URLs
--
-- BACKWARD COMPATIBILITY:
--   - Existing /p/{token} and /b/{token} URLs continue to resolve via redirect_token lookup
--   - Only NEW NFC URL generation switches to /{username}
--   - No existing physical card data is deleted or invalidated

-- 1. Add CHECK constraint for username format on profiles.slug (NOT VALID so legacy rows don't block migration,
--    while all new inserts and updates are strictly validated)
DO $$
BEGIN
  ALTER TABLE profiles
    ADD CONSTRAINT chk_profiles_slug_format
    CHECK (
      slug ~ '^[a-z0-9][a-z0-9\-]{1,30}[a-z0-9]$'
      OR
      slug ~ '^[a-z0-9]{3,32}$'
    ) NOT VALID;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add username_locked flag to profiles
--    Set to TRUE when at least one NFC card has been assigned this profile's URL.
--    When locked, slug changes are blocked on the backend.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Add username_locked_at timestamp for audit
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username_locked_at TIMESTAMP;

-- 4. Add a username_aliases table to support legacy username redirects
--    When a user changes username before it was NFC-locked, we still support old slugs
CREATE TABLE IF NOT EXISTS username_aliases (
  id VARCHAR(64) PRIMARY KEY,
  profile_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alias VARCHAR(128) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_username_aliases_alias ON username_aliases(alias);
CREATE INDEX IF NOT EXISTS idx_username_aliases_profile_id ON username_aliases(profile_id);

-- 5. Index profiles.slug for fast username lookup (already unique, adding btree for lower() queries)
CREATE INDEX IF NOT EXISTS idx_profiles_slug_lower ON profiles(lower(slug));

-- 6. Add nfc_url column to purchased_cards to store the computed public NFC URL
--    This is the URL written to the physical NFC chip (e.g. https://taptch.com/john)
ALTER TABLE purchased_cards
  ADD COLUMN IF NOT EXISTS nfc_url TEXT;

-- 7. Backfill nfc_url for existing purchased_cards that have a linked profile
--    Uses the profile slug directly: https://taptch.com/{slug}
UPDATE purchased_cards pc
SET nfc_url = 'https://taptch.com/' || p.slug
FROM profiles p
WHERE pc.profile_id = p.id
  AND pc.nfc_url IS NULL;

-- 8. Add profile_username to purchased_cards for denormalized fast access
ALTER TABLE purchased_cards
  ADD COLUMN IF NOT EXISTS profile_username VARCHAR(128);

-- 9. Backfill profile_username
UPDATE purchased_cards pc
SET profile_username = p.slug
FROM profiles p
WHERE pc.profile_id = p.id
  AND pc.profile_username IS NULL;

-- 10. Lock profiles that already have NFC cards assigned (to protect existing data)
UPDATE profiles p
SET username_locked = TRUE,
    username_locked_at = NOW()
WHERE EXISTS (
  SELECT 1
  FROM purchased_cards pc
  WHERE pc.profile_id = p.id
    AND pc.physical_card_id IS NOT NULL
);
