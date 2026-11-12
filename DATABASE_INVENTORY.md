# TAPTCH — Complete Database Inventory & Schema Map

**Engine:** PostgreSQL 16 (Hosted on Supabase)  
**ORM:** Drizzle ORM 0.45.4 (`prepare: false` PgBouncer transaction-safe)  
**Total Tables:** 38 tables  
**Isolation Architecture:** PostgreSQL Row-Level Security (RLS) with session variable injection `app.current_user_id`

---

## 1. Complete Table Catalog

| # | Table Name | Schema File | Primary Key | Foreign Keys / Key Relations | Indexes / Notes |
|---|---|---|---|---|---|
| 1 | `users` | `src/db/schema/auth.ts` | `id` (text) | None | `email_idx`, `phone_idx`, `system_role` |
| 2 | `sessions` | `src/db/schema/auth.ts` | `id` (text) | `user_id -> users(id)` | `token_idx`, `expires_at_idx` |
| 3 | `accounts` | `src/db/schema/auth.ts` | `id` (text) | `user_id -> users(id)` | OAuth / Better Auth providers |
| 4 | `verifications` | `src/db/schema/auth.ts` | `id` (text) | None | OTP codes, identifier verification |
| 5 | `two_factor` | `src/db/schema/auth.ts` | `id` (text) | `user_id -> users(id)` | 2FA secret & backup codes |
| 6 | `invitations` | `src/db/schema/auth.ts` | `id` (text) | `organization_id -> organizations(id)` | Team invitation tokens |
| 7 | `organizations` | `src/db/schema/orgs.ts` | `id` (text) | None | Multi-tenant tenant boundary |
| 8 | `members` | `src/db/schema/orgs.ts` | `id` (text) | `org_id -> organizations(id)`, `user_id -> users(id)` | Organization membership & role |
| 9 | `departments` | `src/db/schema/orgs.ts` | `id` (text) | `org_id -> organizations(id)` | Organizational units |
| 10 | `permissions` | `src/db/schema/permissions.ts` | `id` (text) | None | Fine-grained capability definitions |
| 11 | `role_permissions` | `src/db/schema/permissions.ts` | `id` (text) | `permission_id -> permissions(id)` | RBAC mapping table |
| 12 | `profiles` | `src/db/schema/profiles.ts` | `id` (text) | `user_id -> users(id)`, `org_id -> orgs(id)` | `slug_idx` (unique), `published_json` snapshot |
| 13 | `profile_sections` | `src/db/schema/profiles.ts` | `id` (text) | `profile_id -> profiles(id)` | Ordered profile blocks (links, socials) |
| 14 | `profile_businesses` | `src/db/schema/profiles.ts` | `id` (text) | `profile_id -> profiles(id)` | Associated business cards & metadata |
| 15 | `profile_catalogue_items` | `src/db/schema/profiles.ts` | `id` (text) | `profile_id -> profiles(id)` | Products, services, price lists, brochures |
| 16 | `templates` | `src/db/schema/templates.ts` | `id` (text) | None | 6 luxury theme configurations |
| 17 | `publication_requests` | `src/db/schema/publishing.ts`| `id` (text) | `profile_id -> profiles(id)` | Public publication moderation queue |
| 18 | `cards` | `src/db/schema/cards.ts` | `id` (text) | `user_id -> users(id)`, `profile_id -> profiles(id)` | NFC physical card identifiers & status |
| 19 | `card_batches` | `src/db/schema/cards.ts` | `id` (text) | None | Manufacturer production batch tracking |
| 20 | `card_assignments` | `src/db/schema/cards.ts` | `id` (text) | `card_id -> cards(id)`, `assigned_to -> users(id)` | Historical card assignment ledger |
| 21 | `card_events` | `src/db/schema/cards.ts` | `id` (text) | `card_id -> cards(id)` | Physical tap events & telemetry |
| 22 | `activation_attempts` | `src/db/schema/cards.ts` | `id` (text) | `card_id -> cards(id)` | Failed/successful card claim attempts |
| 23 | `leads` | `src/db/schema/leads.ts` | `id` (text) | `profile_id -> profiles(id)`, `user_id -> users(id)` | Contact exchange submissions |
| 24 | `orders` | `src/db/schema/orders.ts` | `id` (text) | `user_id -> users(id)`, `org_id -> orgs(id)` | Physical card orders with manual payment status |
| 25 | `plans` | `src/db/schema/plans.ts` | `id` (text) | None | 4-tier matrix (`nano`, `micro`, `mini`, `max`) |
| 26 | `plan_entitlements` | `src/db/schema/plans.ts` | `id` (text) | `plan_id -> plans(id)` | Limits (cards, profiles, storage, staff) |
| 27 | `plan_assignment_history`| `src/db/schema/plans.ts` | `id` (text) | `user_id -> users(id)`, `plan_id -> plans(id)` | Audit log of manual plan assignments |
| 28 | `tenant_subscriptions` | `src/db/schema/plans.ts` | `id` (text) | `org_id -> orgs(id)`, `plan_id -> plans(id)` | Active tenant plan binding |
| 29 | `qr_batches` | `src/db/schema/qr.ts` | `id` (text) | `org_id -> orgs(id)` | Dynamic QR pre-print production batches |
| 30 | `qr_categories` | `src/db/schema/qr.ts` | `id` (text) | `org_id -> orgs(id)` | QR categorization |
| 31 | `qr_groups` | `src/db/schema/qr.ts` | `id` (text) | `org_id -> orgs(id)` | QR campaign folders |
| 32 | `qr_codes` | `src/db/schema/qr.ts` | `id` (text) | `batch_id -> qr_batches(id)` | Dynamic tokens (`token_idx` unique) |
| 33 | `qr_scan_events` | `src/db/schema/qr.ts` | `id` (text) | `qr_id -> qr_codes(id)` | Scan metrics (hashed visitor IP, device, geo) |
| 34 | `media_assets` | `src/db/schema/media.ts` | `id` (text) | `user_id -> users(id)` | Cloudflare R2 / Images file ledger |
| 35 | `feature_flags` | `src/db/schema/settings.ts` | `id` (text) | None | Dynamic platform flags |
| 36 | `system_settings` | `src/db/schema/settings.ts` | `id` (text) | None | Brand overrides and global parameters |
| 37 | `audit_logs` | `src/db/schema/audit.ts` | `id` (text) | `actor_id -> users(id)` | Immutable security audit trail |
| 38 | `__taptch_migrations` | Database ledger | `name` (varchar) | None | Migration ledger (0000 - 0013) |

---

## 2. Integrity & Preservation Policy

- Zero table alterations or deletions during backend migration.
- NestJS Drizzle Module will import the exact Drizzle schemas from `src/db/schema/` (or shared library `shared/database/`).
- Zero foreign key breaks or index recalculations.
- `prepare: false` mandatory in connection pooler configuration for PgBouncer safety.

