# TAPTCH — Existing Architecture Forensic Analysis

**Audit Date:** 2026-11-12  
**Current Monolith Platform:** Next.js 16.4.5 App Router + React 19 + Drizzle ORM + PostgreSQL 16 + Redis 6 + Better Auth

---

## 1. Architectural Layers & Inward Dependency Flow

```text
Presentation Layer (Next.js App Router: RSC & Client Components)
       ↓
Route Handler Layer (src/app/api/ Route Handlers with Zod Validation)
       ↓
Application Service Layer (src/modules/<domain>/service.ts)
       ↓
Data Access Layer (src/db/index.ts withActor session-scoped RLS)
       ↓
Persistence & Cache Layer (Supabase PostgreSQL 16 + PgBouncer & Redis)
```

### Presentation Layer
- **Client/Server Split**: Top-level layouts and public marketing routes are Server Components; dashboards, builders, and interactive cards are marked with `'use client'`.
- **UI Component Library**: Custom Radix UI primitives located in `src/components/ui/` styled with Tailwind CSS utility classes adhering to the Obsidian Luxury aesthetic token set (`#0A0A0C` obsidian background, `#121216` charcoal cards, `#D4AF37` metallic gold accents).
- **Template Rendering Studio**: Dual-device live preview (`src/components/profile/StudioWorkspace.tsx`) rendering 6 themes via `src/components/templates/ProfileRenderer.tsx`.

### Route Handler Layer
- Located under `src/app/api/`.
- Every mutation validates inputs via Zod (`updateProfileSchema`, `createLeadSchema`, etc.).
- Handlers call `getCurrentSession()` or `getActorContext(req)` to resolve identity before invoking domain services.
- Return standard JSON responses through `src/lib/api/response.ts` (`apiSuccess`, `apiError`).

### Domain Services Layer (`src/modules/`)
- `profiles`: Profile CRUD, section reordering, dynamic pre-compiled JSON snapshots, publication requests.
- `qr`: Dynamic unguessable token generation, resolution, post-print batch activations, high-speed redirect caching, print sheets.
- `cards`: NFC physical card claims, status tracking, activation attempt logging.
- `leads`: Contact exchange, lead capture, CSV export.
- `orders`: Card orders with offline/waived payment tracking (Phase 2 payments deferred).
- `orgs`: Multi-tenant organization hierarchy, departments, invitations, staff member RBAC.
- `templates`: 6 luxury themes, theme swatch styling, mock preview generation.
- `entitlements`: 4-tier plan enforcement (`nano`, `micro`, `mini`, `max`), permission checks (`can(actor, action, resource)`).

### Data Access Layer (`src/db/`)
- Drizzle ORM 0.45.4 over `postgres.js` with `prepare: false` for PgBouncer connection safety.
- RLS session injection: `withActor(actor, fn)` executes `SELECT set_config('app.current_user_id', $1, true)`.
- Transaction safety: Transactions enforce local isolation to prevent cross-tenant contamination in connection poolers.

---

## 2. Infrastructure & External Services

1. **Database**: PostgreSQL 16 hosted on Supabase (`db.nvrcgauxafpxsaufjtha.supabase.co`), accessed through direct port 5432 and connection pooler.
2. **Caching & Buffering**: Redis (standalone or hosted via ioredis) caching QR tokens (`qr:token:<token>`) and profile snapshots (`profile:slug:<slug>`).
3. **Storage**: Cloudflare Images and Cloudflare R2 bucket integration, with fallback to local mock storage in test/dev environments.
4. **Email / SMS**: Nodemailer SMTP dispatcher with fallback to console logger in test mode. Fast2SMS / Twilio provider for mobile OTP verification.
5. **Observability**: Structured JSON logging via Pino with sensitive credential redaction (tokens, passwords, OTPs).

