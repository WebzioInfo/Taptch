# TAPTCH — Campaign Database Impact & Schema Analysis

**Document Status:** Complete  
**Date:** November 2026  
**Target Migration:** `0013_remove_campaign_module.sql`  
**Database Engines:** Supabase PostgreSQL 17 (Production) & PGlite (Isolated Testing)

---

## 1. Database Objects Identified & Impact Matrix

All database objects identified for removal were confirmed to be 100% campaign-specific. None of these tables, columns, indexes, or constraints are referenced by or shared with core TAPTCH platform features.

| Table Name | Description | Inbound Foreign Keys | Outbound Foreign Keys | Drop Order (Reverse FK Dependency) |
| :--- | :--- | :--- | :--- | :--- |
| `campaign_documents` | Invoices & packing slips metadata | None | `campaign_orders(id)` | 1 |
| `campaign_inventory_movements` | Stock reservations & purchases | None | `campaign_products(id)`, `campaign_orders(id)`, `users(id)` | 2 |
| `campaign_expenses` | Operational COGS & overhead expenses | None | `users(id)` | 3 |
| `campaign_refunds` | Refund records | None | `campaign_orders(id)`, `campaign_payments(id)`, `users(id)` | 4 |
| `campaign_payments` | Offline payment UTR references | `campaign_refunds` | `campaign_orders(id)`, `users(id)` | 5 |
| `campaign_designs` | User customization snapshots | None | `campaign_orders(id)` | 6 |
| `campaign_orders` | Customer card orders | `campaign_documents`, `campaign_inventory_movements`, `campaign_refunds`, `campaign_payments`, `campaign_designs` | `campaign_products(id)`, `users(id)` | 7 |
| `campaign_products` | Fixed campaign products (Matte PVC, Metal, Bamboo) | `campaign_orders`, `campaign_inventory_movements` | None | 8 |
| `campaign_settings` | Campaign parameters & GST rates | None | None | 9 |

---

## 2. Associated Indexes Removed

The following specific indexes created by migrations `0010` and `0011` are dropped automatically upon table deletion:
- `idx_campaign_orders_num` on `campaign_orders(order_number)`
- `idx_campaign_orders_barcode` on `campaign_orders(barcode)`
- `idx_campaign_orders_phone` on `campaign_orders(customer_phone)`
- `idx_campaign_orders_idempotency` on `campaign_orders(idempotency_key)`
- `idx_campaign_payments_ref` on `campaign_payments(transaction_reference)`
- `idx_campaign_payments_order` on `campaign_payments(order_id)`

---

## 3. Core Database Tables Untouched & Preserved

Zero modifications were made to any of the core platform tables:
- Authentication & Multi-Tenancy: `users`, `sessions`, `accounts`, `verifications`, `two_factors`, `organizations`, `members`, `invitations`, `departments`
- Core Digital Identity: `profiles`, `profile_businesses`, `profile_sections`, `templates`, `publication_requests`, `plan_assignment_history`
- Contactless Hardware & Core CRM: `cards`, `leads`, `orders` (core physical card order requests)
- Dynamic QR Subsystem: `qr_batches`, `qr_codes`, `qr_scan_events`
- Media Assets: `media_assets`
- Platform Security: `permissions`, `role_permissions`, `audit_logs`, `system_settings`

---

## 4. Migration Execution Plan (`0013_remove_campaign_module.sql`)

```sql
-- Drops exclusively campaign-related tables in reverse foreign-key order
DROP TABLE IF EXISTS "campaign_documents" CASCADE;
DROP TABLE IF EXISTS "campaign_inventory_movements" CASCADE;
DROP TABLE IF EXISTS "campaign_expenses" CASCADE;
DROP TABLE IF EXISTS "campaign_refunds" CASCADE;
DROP TABLE IF EXISTS "campaign_payments" CASCADE;
DROP TABLE IF EXISTS "campaign_designs" CASCADE;
DROP TABLE IF EXISTS "campaign_orders" CASCADE;
DROP TABLE IF EXISTS "campaign_products" CASCADE;
DROP TABLE IF EXISTS "campaign_settings" CASCADE;
```

**Testing Result:** Executed against local isolated test database (`.pgdata`). All 9 tables were dropped without errors. Post-migration schema integrity check confirmed 0 campaign tables remaining.

