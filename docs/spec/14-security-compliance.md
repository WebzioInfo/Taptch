# Taptch Specification — 14 Security, Privacy & Compliance

> Source: Master Prompt Section 14

## Non-Negotiable Security Architecture
Security is engineered into every architectural boundary, not bolted on as an afterthought.

### 1. Input Validation & Defense-in-Depth
- Strict Zod schema validation on every inbound request body, URL query parameter, and route parameter.
- Explicit TypeScript output encoding and sanitization (DOMPurify on rich text / custom HTML).
- ORM parameterized queries exclusively via Prisma; raw SQL queries are prohibited unless strictly parameterized for partitioned table management.

### 2. HTTP & Network Hardening
- **Content Security Policy (CSP)**: Strict script-src, style-src, frame-ancestors 'none' (except permitted booking/video iframes).
- **HSTS**: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- **Cookies**: `HttpOnly`, `SameSite=Lax`, `Secure` on all authentication tokens.
- **CSRF Protection**: Double-submit cookie or origin-header validation on all state-mutating requests.
- **SSRF Defense**: URL validation on user-submitted links (e.g. webhooks, avatars) blocking internal IPs (127.0.0.1, 10.0.0.0/8, 169.254.169.254, AWS metadata).

### 3. Tenant Isolation & PostgreSQL RLS
- Two-tier multi-tenant security:
  1. **Application Layer**: Tenant-scoped Data Access Layer (DAL) where every database query requires an explicit `ActorContext` with verified `tenantId` / `organizationId`.
  2. **Database Layer (RLS)**: Row-Level Security enabled on PostgreSQL tables (`profiles`, `leads`, `cards`, `orders`, `invoices`). RLS policies verify `current_setting('app.current_org_id')` or user ID, providing fail-safe protection against application bugs.
- Automated CI regression tests specifically verifying IDOR and cross-tenant leakage prevention.

### 4. File Upload Pipeline Security
- Direct client-to-storage presigned PUT URLs with short expiry (5 minutes).
- Server-side MIME sniffing on uploaded binary chunks (magic byte inspection, not trusting user file extension).
- Maximum file size caps: 5MB for profile avatars, 10MB for brochures.
- Re-encoding via `sharp` removes EXIF metadata, embedded scripts, and re-compresses into clean WebP/AVIF.

### 5. Rate Limiting & Abuse Prevention
- Redis-backed distributed rate limiters:
  - Auth / OTP endpoints: 5 requests per 10 minutes per IP/phone.
  - Card Activation: 5 failed attempts per 15 minutes before lockout.
  - Public Profile Contact Exchange: 3 submissions per 10 minutes per IP.
  - API v1 endpoints: Tier-based tokens (e.g. 60 req/min for free, 600 req/min for enterprise).

### 6. Privacy & Regulatory Compliance (DPDP Act 2023 & GDPR)
- **Explicit Consent**: Contact exchange forms mandate a positive affirmative checkbox.
- **Zero Sensitive Data Exposure**: Public profile endpoints return only intentionally published content; internal IDs, hashed passwords, billing details, and unlinked card tokens are never serialized in public responses.
- **Right to Erasure & Export**:
  - Full self-serve Data Export workflow (JSON bundle of all user profiles, cards, and leads).
  - GDPR/DPDP compliant Account Deletion pipeline scrubbing personal information and hard-deleting associated media assets.
- **Audit Trails**: Immutable `audit_logs` table tracking sensitive events (admin impersonation, role modifications, card reassignments, bulk imports, security anomalies).

