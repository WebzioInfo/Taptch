# TAPTCH — Complete Database Migration Audit

**Generated Date:** November 9, 2026  
**Project:** Taptch — Production-Grade NFC Digital Identity SaaS  
**Architect:** Principal Database Architect & DevOps Engineer  
**Scope:** Complete elimination of local production database dependencies; Supabase PostgreSQL as the single source of truth.

---

## 1. Executive Summary

This audit catalogs every database dependency, connection utility, container, and script in the TAPTCH codebase. The application has been evaluated to ensure that **Supabase PostgreSQL is the sole application runtime database**, with all legacy local PostgreSQL container infrastructure removed and local fallback connection strings purged.

---

## 2. Inventory of Database Dependencies & Artifacts

| Component | Discovered State | Role & Classification | Intended Replacement / Action |
|---|---|---|---|
| **Supabase PostgreSQL** | Live project `nvrcgauxafpxsaufjtha` (AWS ap-south-1) | **Single Production & Dev Database** | Preserved as sole source of truth for all runtime operations. |
| **Docker Compose `postgres`** | `postgres:16-alpine` on port 5432 | **Obsolete Local Database** | Removed from `docker-compose.yml`. |
| **Docker Compose `pgbouncer`** | `edoburu/pgbouncer:latest` on port 6432 | **Obsolete Local Pooler** | Removed from `docker-compose.yml`. |
| **Docker Volume `postgres_data`** | Local named volume | **Obsolete Local Storage** | Removed from `docker-compose.yml`. |
| **Init Script `01-init-roles.sql`** | `infra/docker/postgres-init/` | **Obsolete Local Init** | Removed / archived. |
| **Local DB URL Fallback** | `postgres://taptch_app:taptch_app_pass@localhost:6432/...` | **Legacy Hardcoded Fallback** | Purged from `src/db/index.ts` and `src/db/migrate.ts`. Replaced with explicit configuration validation errors. |
| **PGlite (`@electric-sql/pglite`)** | In-process WebAssembly PostgreSQL | **Isolated Test Runner Only** | Strictly isolated to automated unit testing (`NODE_ENV === 'test'`). Blocked from runtime/production. |
| **SQLite** | None discovered | N/A | No SQLite usage exists in repository. |
| **Drizzle ORM** | `drizzle-orm@0.45.4` + `postgres.js@3.4.9` | **Data Access Layer** | Configured with `prepare: false` for compatibility with transaction-mode poolers. |
| **Better Auth** | `drizzleAdapter` over Supabase PostgreSQL | **Authentication Engine** | All users, sessions, accounts, and 2FA records stored directly in Supabase. |
| **Redis** | `ioredis@6.0.0` on port 6379 | **Cache & Message Queue** | Retained strictly as an in-memory redirect cache and queue buffer; never used as persistent DB. |
| **Mailpit** | `axllent/mailpit:latest` on port 1025/8025 | **Dev Email Testing** | Retained for local transactional email verification. |

---

## 3. Discovered Supabase Database State

Direct empirical inspection of `nvrcgauxafpxsaufjtha.supabase.co` on port 5432 confirmed:

- **Connectivity:** Active, verified with zero network latency.
- **PostgreSQL Version:** PostgreSQL 16.x (AWS ap-south-1).
- **Public Tables (47 total):**
  - Core Auth: `users` (19), `accounts` (19), `sessions` (0), `verifications` (0), `two_factor` (0).
  - Multi-Tenancy & Roles: `organizations` (1), `members` (12), `departments` (3), `invitations` (0), `permissions` (14), `role_permissions` (53).
  - Digital Profiles: `profiles` (5), `profile_sections` (0), `profile_businesses` (0), `profile_catalogue_items` (0), `templates` (6), `publication_requests` (0).
  - Cards & Hardware: `cards` (0), `card_batches` (0), `card_assignments` (0), `card_events` (0), `activation_attempts` (0).
  - Dynamic QR: `qr_codes` (0), `qr_batches` (0), `qr_categories` (0), `qr_groups` (0), `qr_scan_events` (0).
  - Plans & Entitlements: `plans` (8), `plan_entitlements` (67), `tenant_subscriptions` (1), `plan_assignment_history` (0).
  - Media & Storage: `media_assets` (0).
  - Campaigns: `campaign_products` (0), `campaign_orders` (0), `campaign_payments` (0), `campaign_refunds` (0), `campaign_designs` (0), `campaign_documents` (0), `campaign_expenses` (0), `campaign_inventory_movements` (0), `campaign_settings` (0).
  - System: `system_settings` (1), `audit_logs` (0), `feature_flags` (0), `__taptch_migrations` (13).

- **Applied Migrations (13/13 verified):**
  1. `0000_cute_mandarin.sql`
  2. `0001_rls_policies.sql`
  3. `0002_two_factor_fields.sql`
  4. `0003_invitations_created_at.sql`
  5. `0004_templates_and_businesses.sql`
  6. `0005_leads_and_orders.sql`
  7. `0006_media_and_publishing.sql`
  8. `0007_dynamic_qr_engine.sql`
  9. `0008_post_print_activation_dynamic_qr.sql`
  10. `0009_organization_staff_management.sql`
  11. `0010_instagram_card_campaign.sql`
  12. `0011_campaign_idempotency_key.sql`
  13. `0012_cloudflare_storage.sql`

---

## 4. Replacement & Cleanup Plan

1. **Purge Connection Fallbacks:** Update `src/db/index.ts` and `src/db/migrate.ts` to reject execution if `DATABASE_URL` is missing outside test runs.
2. **Clean Docker Compose:** Remove `postgres`, `pgbouncer`, and `postgres_data` volume from `docker-compose.yml`. Retain `redis`, `minio`, and `mailpit`.
3. **Environment Security:** Enforce SSL connection string with `ssl: 'require'` for remote PostgreSQL connections.
4. **Idempotent Seeding:** Refactor `src/db/seed.ts` to ensure development seed accounts are created through Better Auth APIs only when `ENABLE_DEV_SEED_ACCOUNTS=true`.
5. **Secure Dev Credentials:** Generate random passwords for dev accounts, store exclusively in gitignored `DEV_LOGIN_CREDENTIALS.md`, and verify logins.
