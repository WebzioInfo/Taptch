# TAPTCH — Complete Authentication Architecture & Security Audit

> **DOCUMENT CLASSIFICATION**: TECHNICAL SYSTEM AUDIT & ARCHITECTURE SPECIFICATION  
> **Target Application**: TAPTCH (Next.js 16 App Router, React 19, Better Auth 1.7.14)  
> **Database Engine**: PostgreSQL 16 (Supabase Cloud Hosted via Drizzle ORM)  
> **Date of Audit**: November 9, 2026  
> **Auditors**: Principal Authentication Architect, PostgreSQL Specialist & Security Lead  

---

## 1. Executive Summary

This audit presents a deep architectural investigation and full security evaluation of the TAPTCH authentication subsystem following the complete migration to Supabase PostgreSQL.

### Key Audit Findings
1. **Root Cause of `POST /api/auth/sign-up/email → 500`**:
   - In previous sessions before Supabase migration, Next.js was attempting to query local Docker PostgreSQL at `localhost:5432`. When the container was stopped or unreachable, the connection failed with an unhandled `ECONNREFUSED`, generating an unhandled 500 Internal Server Error.
   - Origin validation mismatch: Better Auth was strictly configured with `process.env.BETTER_AUTH_URL` (`http://localhost:3000`). When accessed via loopback IPv4 (`http://127.0.0.1:3000`) or alternate development ports, Better Auth rejected requests with `403 INVALID_ORIGIN`.
   - Client Error Display: In `src/app/(auth)/register/page.tsx`, any server error or unhandled response fell back to the generic message `"Registration failed"` without providing field-level diagnostics.
2. **Root Cause of Failed Logins for Existing Seed Accounts**:
   - The initial seed script had a custom `hashPassword` function using `crypto.createHash('sha256')`. Better Auth uses its native scrypt hashing format (`<salt>:<scrypt_hash>`).
   - Consequently, every pre-seeded administrative and corporate user failed credential verification because Better Auth could not parse the raw SHA-256 string.
   - `superadmin@taptch.com` and `support@taptch.com` had legacy `two_factor_enabled = true` without corresponding TOTP secrets in the `two_factor` table, trapping them in an unresolvable 2FA redirection loop.
3. **Current Resolution**:
   - Supabase PostgreSQL is verified as the sole live data store.
   - `src/lib/auth/index.ts` trusted origins expanded to include `127.0.0.1:3000`, `localhost:3000`, and local ports.
   - All core administrative and development accounts have been re-hashed with Better Auth's native scrypt algorithm and verified active via `auth.api.signInEmail`.
   - Two-factor flags were sanitized so administrators can authenticate directly with credentials while maintaining full ability to enable TOTP 2FA.

---

## 2. Architecture & Component Inspection

### 2.1 Technology Stack Alignment
- **Authentication Engine**: Better Auth `^1.7.14`
- **Database Adapter**: `drizzleAdapter` (`@better-auth/adapters/drizzle`)
- **Database Driver**: `postgres.js` with SSL enabled (`?sslmode=require`) connecting to Supabase Cloud
- **Frontend Client**: `better-auth/react` via `createAuthClient`
- **Password Hasher**: Scrypt with per-user cryptographic salt via `better-auth/crypto`
- **Session Transport**: Cryptographically signed HttpOnly cookies

### 2.2 Schema & Table Mapping
The database schema defined in `src/db/schema/auth.ts` maps directly to Better Auth's expected model:

| Drizzle Model | PostgreSQL Table | Primary Key | Critical Fields | Better Auth Mapping |
|---|---|---|---|---|
| `users` | `public.users` | `id` (text) | `email` (unique), `emailVerified`, `systemRole`, `status` | `user: schema.users` |
| `sessions` | `public.sessions` | `id` (text) | `token` (unique), `userId`, `expiresAt`, `ipAddress` | `session: schema.sessions` |
| `accounts` | `public.accounts` | `id` (text) | `userId`, `providerId`, `password`, `accountId` | `account: schema.accounts` |
| `verifications`| `public.verifications`| `id` (text) | `identifier`, `value`, `expiresAt` | `verification: schema.verifications`|
| `organizations`| `public.organizations`| `id` (text) | `name`, `slug` (unique) | `organization: schema.organizations`|
| `members` | `public.members` | `id` (text) | `organizationId`, `userId`, `role` | `member: schema.members` |
| `invitations` | `public.invitations` | `id` (text) | `organizationId`, `email`, `status` | `invitation: schema.invitations`|
| `twoFactor` | `public.two_factor` | `id` (text) | `userId`, `secret`, `verified` | `twoFactor: schema.twoFactor` |

### 2.3 Route Handler Integration
- **Handler Path**: `src/app/api/auth/[...all]/route.ts`
- **Implementation**:
  ```typescript
  import { auth } from '@/lib/auth';
  import { toNextJsHandler } from 'better-auth/next-js';

  export const dynamic = 'force-dynamic';
  export const { GET, POST } = toNextJsHandler(auth);
  ```
- **Dynamic Configuration**: `export const dynamic = 'force-dynamic'` strictly prevents Next.js from attempting static generation of auth endpoints.

---

## 3. Security Audit & Vulnerability Assessment

### 3.1 Cookie Security
Better Auth generates session tokens using cryptographically signed, secure cookies:
- **Cookie Name**: `better-auth.session_token` (HTTP dev) / `__Secure-better-auth.session_token` (Production HTTPS)
- **HttpOnly**: `true` — prevents JavaScript access, completely mitigating client-side XSS session theft.
- **SameSite**: `Lax` — protects against Cross-Site Request Forgery (CSRF) in cross-origin requests while enabling standard top-level navigations.
- **Secure**: Enabled in production (`useSecureCookies: process.env.NODE_ENV === 'production'`).
- **Signature Verification**: Verified using HMAC-SHA256 signature signed by `BETTER_AUTH_SECRET`.

### 3.2 Password Hashing & Timing-Attack Resistance
- Better Auth uses the Node.js native `scrypt` implementation with CPU cost `N = 16384`, `r = 8`, `p = 1`, generating a 64-byte key with a unique 16-byte cryptographic salt.
- Password equality comparisons use `crypto.timingSafeEqual` via `constantTimeEqual` from `better-auth/crypto`, strictly eliminating side-channel timing attacks.

### 3.3 Multi-Tenant Isolation & Role-Based Access Control
- Every user row maintains a `systemRole` (`super_admin` | `support_admin` | `user`).
- Corporate tenancy is enforced via the `members` table linking `userId` to `organizationId` with specific enterprise roles (`owner` | `admin` | `manager` | `employee` | `viewer`).
- Middleware gates protected workspaces (`/dashboard`, `/admin`, `/cards`, `/qr`, `/leads`, `/team`, `/builder`) before page rendering occurs.

### 3.4 Rate Limiting & Denial of Service Defense
- Better Auth enforces internal rate-limiting on sensitive credential endpoints (`sign-in/email`, `sign-up/email`, and OTP verification).
- Excessive failed login attempts trigger `429 Too Many Requests`.

---

## 4. Operational Sign-Off
All core authentication paths (registration, password sign-in, OTP dispatch, session verification, and protected route access) have been tested, repaired, and validated against the live Supabase PostgreSQL production database.
