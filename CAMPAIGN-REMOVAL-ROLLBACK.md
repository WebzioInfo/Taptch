# TAPTCH — Campaign Removal Rollback Runbook

**Document Purpose:** In the event that commercial NFC sales campaign functionality must be restored, this document specifies the step-by-step procedure to roll back code, schema, and routing.

---

## 1. Codebase Rollback

Since all changes are tracked in Git:

### Option A: Clean Git Revert (Recommended)
```bash
# Revert the campaign removal commit
git revert <commit-hash>
git push origin main
```

### Option B: Branch-Specific Cherry-Pick
All deleted campaign files are preserved in the git history of branch `modernization/stack-upgrade` or `main` prior to the removal commit.

---

## 2. Database Schema Rollback

To restore the dropped campaign tables on PostgreSQL:

1. Execute the historical migration `src/db/migrations/0010_instagram_card_campaign.sql` against the database.
2. Execute `src/db/migrations/0011_campaign_idempotency_key.sql` to recreate the idempotency column and index.
3. Remove the entry `'0013_remove_campaign_module.sql'` from `__taptch_migrations`:
   ```sql
   DELETE FROM __taptch_migrations WHERE name = '0013_remove_campaign_module.sql';
   ```

---

## 3. Environment Variables Rollback

Restore the campaign configuration block to `.env.local` / `.env.production`:
```env
NEXT_PUBLIC_CAMPAIGN_BRAND_NAME="Smart NFC Profile Card"
NEXT_PUBLIC_CAMPAIGN_TAGLINE="Your Instagram. One Tap Away."
NEXT_PUBLIC_CAMPAIGN_DOMAIN=https://taptch.com
CAMPAIGN_SUPPORT_EMAIL=support@taptch.com
CAMPAIGN_SUPPORT_PHONE="+91 98765 43210"
CAMPAIGN_SUPPORT_WHATSAPP="+919876543210"
CAMPAIGN_DESIGNER_WHATSAPP="+919876543211"
CAMPAIGN_UPI_VPA=pay@taptch
CAMPAIGN_BANK_NAME="HDFC Bank Ltd"
CAMPAIGN_BANK_ACCOUNT="50200012345678"
CAMPAIGN_BANK_IFSC="HDFC0000123"
CAMPAIGN_BANK_HOLDER="Contactless Commerce Solutions"
```

