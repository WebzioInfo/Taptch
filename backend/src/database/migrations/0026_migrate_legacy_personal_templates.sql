-- Safe migration: Map obsolete Personal Profile template identifiers to 'cinematic-noir'
-- Preserves all profile IDs, usernames/slugs, ownership, statuses, and user-entered data.
-- Rollback note: Legacy template IDs are superseded by 'cinematic-noir'; no destructive deletes performed.

UPDATE profiles
SET
  template_id = 'cinematic-noir',
  theme_id = 'cinematic-noir',
  updated_at = NOW()
WHERE
  (profile_type = 'personal' OR profile_type IS NULL)
  AND (
    template_id IS NULL
    OR template_id = ''
    OR LOWER(template_id) IN (
      'obsidian-luxury',
      'obsidian',
      'premium-brand',
      'clean-corporate',
      'dark-premium',
      'soft-modern',
      'bold-editorial',
      'ivory-minimal',
      'ivory-minimalist',
      'aurora-creator',
      'apex-capital'
    )
  );
