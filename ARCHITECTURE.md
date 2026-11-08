# TAPTCH — System Architecture & Engineering Specifications

## 1. System Overview
TAPTCH is an enterprise-grade digital identity platform engineered to bridge physical NFC devices, dynamic QR codes, and digital profile experiences into actionable lead generation workflows.

```
+-------------------------------------------------------------------------------+
|                             CLIENT APPLICATION                                |
|  Next.js 16 App Router (Turbopack) • React 19 • Tailwind CSS • Lucide Icons|
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|                              API ROUTE HANDLERS                               |
|       Authentication • Authorization (can) • Input Validation (Zod)           |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|                               DOMAIN SERVICES                                 |
|  Profiles • Templates • Cards • Leads • Organizations • Campaign Engine       |
+-------------------------------------------------------------------------------+
                                      |
                   +------------------+------------------+
                   |                                     |
                   v                                     v
+-------------------------------------+ +-------------------------------------+
|         PERSISTENCE LAYER           | |         ASYNC WORKER QUEUES         |
| PostgreSQL 16 (PgBouncer Pooled)   | | BullMQ • Redis 7.2 Cache-Aside      |
| Drizzle ORM (prepare: false)       | | Draft Auto-Save • Image Processing  |
| Local: @electric-sql/pglite        | | Analytics Ingestion                 |
+-------------------------------------+ +-------------------------------------+
```

---

## 2. Core Architectural Pillars

### Pillar 1: Layered Inward Dependencies
- Presentation components never directly mutate persistence models.
- Communication flows inward toward domain logic. All inter-module operations leverage typed service contracts.

### Pillar 2: PgBouncer Pooling Safety
- Pooled connections use `prepare: false` in `postgres.js` to ensure compatibility with transaction-mode connection poolers.
- Multi-tenant PostgreSQL session variables are injected using transaction-scoped configs:
  ```sql
  SELECT set_config('app.current_user_id', $1, true);
  ```
  The third argument (`is_local = true`) guarantees zero parameter leakage across pooled transactions.

### Pillar 3: Zero Dynamic Profile Hot Path
- Public profile pages (`/p/[slug]`) avoid dynamic headers, cookies, or database transactions on the critical rendering path.
- Profile payloads are served from cached JSON snapshots or CDN edge nodes with sub-50ms TTFB.

### Pillar 4: Campaign Isolation
- Commercial sales campaigns (such as the Instagram NFC Card Campaign under `src/campaigns/`) are architecturally isolated modules.
- Independent configuration (`campaignBrandConfig`) prevents coupling with the parent platform.

### Pillar 5: Cloudflare Edge & Unified Storage
- Storage is unified under `src/lib/storage/` with Cloudflare Images (Direct Creator Upload v2 and delivery variants) and Cloudflare R2 (S3 SigV4 direct upload for non-image assets).
- Fully decoupled from proprietary SDKs with built-in offline mock provider for automated testing and CI/CD pipelines.

---

## 3. Database Schema Overview

| Table | Purpose | Multi-Tenant Key |
|---|---|---|
| `users` | Core user identity, credentials, 2FA settings | `id` |
| `organizations` | Multi-user corporate accounts | `id` |
| `org_members` | Staff roles, permissions, department assignments | `org_id` |
| `profiles` | Personal and business digital profiles | `user_id`, `org_id` |
| `profile_sections` | Dynamic modular profile sections | `profile_id` |
| `qr_codes` | Dynamic short tokens and redirect destinations | `user_id`, `org_id` |
| `media_assets` | Provider-neutral media registry (Cloudflare Images & R2) | `user_id`, `org_id` |
| `campaign_products` | Commercial campaign catalog items | `campaign_key` |
| `campaign_orders` | Physical card orders, payments, shipments | `campaign_key` |

