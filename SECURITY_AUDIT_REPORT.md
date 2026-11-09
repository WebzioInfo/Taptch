# TAPTCH — Comprehensive Security & Compliance Audit Report

## 1. Executive Summary

This Security Audit Report documents the application security posture, data privacy architecture, threat modeling, and defensive implementations across the TAPTCH digital identity, dynamic NFC, and profile studio platform.

The system is evaluated against the **OWASP Top 10 (2021/2025)**, the **Digital Personal Data Protection Act (DPDP Act, India 2023)**, and multi-tenant SaaS security best practices.

---

## 2. OWASP Top 10 Verification & Defense Matrix

| OWASP Vulnerability Category | Risk Level | Defense Architecture in TAPTCH | Status |
|---|---|---|---|
| **A01: Broken Access Control** | **Critical** | Server-side permission gates (`can(actor, action, resource)`). Multi-tenant Row-Level Security (`FORCE ROW LEVEL SECURITY`) with `withActor(actor, fn)` session variables. Explicit tenancy validation on all mutations. Zero reliance on UI hiding. | **PROTECTED** |
| **A02: Cryptographic Failures** | **High** | HTTPS everywhere (HSTS 1 year, preload). 24-hour salted rotating IP hash (`VISITOR_SALT_SECRET`) ensuring zero storage of raw visitor IPs. AES-256 encrypted tokens for card activation. Passwords hashed using Argon2id via Better Auth. | **PROTECTED** |
| **A03: Injection** | **Critical** | Drizzle ORM strictly parameterized queries (`prepare: false`). Zero string-concatenated SQL queries. Strict Zod schemas validating all API route and Server Action inputs. Strict regex enforcement for UPI VPAs (`^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$`). | **PROTECTED** |
| **A04: Insecure Design** | **High** | Zero Dynamic Hot Path on public profiles (`/p/[slug]`). Decoupled BullMQ background workers preventing web server starvation. Two-tier card activation (physical token matching). Payment gateway SDKs deferred to Phase 2 (zero cardholder data risks). | **PROTECTED** |
| **A05: Security Misconfiguration** | **Medium** | Strict security headers configured in `next.config.ts` (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Default credentials prohibited. `.env*` files excluded in `.gitignore`. | **PROTECTED** |
| **A06: Vulnerable & Outdated Components** | **Medium** | Upgraded to Next.js 16.4.5 LTS, React 19.3.1, TypeScript 5.9.3, Drizzle ORM. Complete removal of deprecated Cloudinary SDKs. NPM lockfile integrity strictly audited (`npm audit`). | **PROTECTED** |
| **A07: Identification & Authentication Failures** | **Critical** | Better Auth session engine with HttpOnly, Secure, SameSite=Lax cookie management. Session invalidation on password change or logout. Brute-force rate limiting on auth endpoints (`/api/auth/*`). | **PROTECTED** |
| **A08: Software & Data Integrity Failures** | **High** | Immutable profile snapshots pre-compiled on publish (`renderedSnapshot`). Strict NPM package-lock enforcement in CI/CD. Anti-CSRF protection on all state-changing endpoints. | **PROTECTED** |
| **A09: Security Logging & Monitoring Failures** | **Medium** | Structured JSON logging with Pino (`src/lib/logger.ts`). Built-in secret redaction masking `password`, `token`, `secret`, `authorization`, and `otp`. Centralized health checks at `/api/health`. | **PROTECTED** |
| **A10: Server-Side Request Forgery (SSRF)** | **High** | Image uploads processed directly via authenticated Cloudflare R2 / Cloudflare Images APIs. Public profile external links strictly sanitized (http/https protocols enforced; `javascript:` and data URIs rejected). | **PROTECTED** |

---

## 3. Detailed Security Architecture Implementations

### 3.1 Multi-Tenant Row-Level Security & PgBouncer Safety
In multi-tenant PostgreSQL environments using connection pooling (Supabase / PgBouncer), session leakage between transactions is a critical risk.
TAPTCH eliminates this risk through transaction-local configuration:
```sql
SELECT set_config('app.current_user_id', $1, true);
```
The parameter `is_local = true` ensures that when the transaction terminates or returns to the pool, the session variable is automatically cleared, preventing cross-tenant data contamination.

All queries under `src/modules/*/` run through `withActor(actor, fn)`, enforcing:
1. Active user authentication.
2. Tenant membership verification.
3. PostgreSQL RLS context injection before query execution.

### 3.2 Privacy & DPDP Act Compliance (Visitor Analytics)
Under the Digital Personal Data Protection Act (DPDP Act, 2023), visitor IP addresses are protected personal identifiers.
TAPTCH enforces strict privacy-safe analytics in `src/modules/analytics/`:
- Raw IP addresses are **never stored** in the database.
- Every incoming visitor IP is concatenated with a daily rotating salt (`VISITOR_SALT_SECRET + YYYY-MM-DD`) and passed through SHA-256.
- The resulting 64-character hash allows unique visitor counting for the current day without preserving any reversible personal data.
- The salt rotates every 24 hours, making cross-day tracking or retro-identification mathematically impossible.

### 3.3 UPI Payment Security & P2P Intent Handling
The newly integrated UPI Payment module (`src/lib/upi.ts` and `src/components/profile/UpiPaymentCard.tsx`) adheres to the following security guidelines:
1. **Zero Custody**: TAPTCH does not act as a payment gateway, does not handle cardholder data, does not process money, and does not maintain escrow balances.
2. **Client-Side Intent Generation**: All UPI links conform to standard NPCI specification (`upi://pay?pa=...&pn=...&cu=INR`). Clicking the link opens the user's native UPI app (Google Pay, PhonePe, Paytm, BHIM) directly on their mobile device.
3. **Format Validation**: VPAs are strictly validated on both client and server against `UPI_VPA_REGEX` to prevent injection of malicious URLs or URI schemes.
4. **Offline Disclaimer**: Profile visitors are shown an explicit verification notice advising them to verify the recipient name in their UPI application prior to entering their UPI PIN.

### 3.4 Secret Redaction & Logging Hygiene
All system logs emitted through `src/lib/logger.ts` pass through automated redaction paths:
- `req.headers.authorization`
- `req.headers.cookie`
- `password`
- `newPassword`
- `token`
- `secret`
- `otp`
- `vpa` (partially masked in debug logs)

---

## 4. Verification & Testing Evidence

1. **Brand Literal Governance**: `tests/architecture/brand-literal.test.ts` ensures zero customer names or unauthorized brand identifiers are hardcoded in application templates.
2. **Access Control & Permissions**: Vitest test suites (`tests/unit/can.test.ts`, `tests/unit/entitlements.test.ts`) verify that resource limits, plan tiers, and role-based actions are strictly enforced.
3. **Profile Validation Pre-flight**: `tests/unit/profile-design-studio.test.ts` verifies that incomplete profiles, invalid VPAs, or malformed social URLs are rejected before publishing.

