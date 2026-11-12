-- ====================================================================
-- TAPTCH MIGRATION 0013: COMPLETE REMOVAL OF CAMPAIGN MODULE TABLES
-- Safely drops confirmed campaign-specific database objects in reverse dependency order.
-- Core platform tables (users, orgs, profiles, cards, leads, orders, qr, media) are untouched.
-- ====================================================================

-- 1. Dependent documents & logs
DROP TABLE IF EXISTS "campaign_documents" CASCADE;
--> statement-breakpoint

-- 2. Inventory movements
DROP TABLE IF EXISTS "campaign_inventory_movements" CASCADE;
--> statement-breakpoint

-- 3. Operational expenses
DROP TABLE IF EXISTS "campaign_expenses" CASCADE;
--> statement-breakpoint

-- 4. Financial refunds & payments
DROP TABLE IF EXISTS "campaign_refunds" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "campaign_payments" CASCADE;
--> statement-breakpoint

-- 5. Design snapshots
DROP TABLE IF EXISTS "campaign_designs" CASCADE;
--> statement-breakpoint

-- 6. Campaign orders
DROP TABLE IF EXISTS "campaign_orders" CASCADE;
--> statement-breakpoint

-- 7. Campaign products
DROP TABLE IF EXISTS "campaign_products" CASCADE;
--> statement-breakpoint

-- 8. Campaign settings
DROP TABLE IF EXISTS "campaign_settings" CASCADE;

