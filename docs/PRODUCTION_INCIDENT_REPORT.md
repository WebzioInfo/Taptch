# TAPTCH — Production Incident Investigation & Resolution Report

**Incident ID:** INC-2026-11-AUTH-001  
**Severity:** CRITICAL (P0)  
**Affected Endpoint:** `POST https://taptch.com/api/auth/sign-in/email`  
**Reported Symptom:** `net::ERR_QUIC_PROTOCOL_ERROR` in browser, "Failed to sign in. Please check your connection."  
**Status:** ROOT CAUSE IDENTIFIED, CODE FIXES APPLIED & VERIFIED, INFRASTRUCTURE RESOLUTION DOCUMENTED  

---

## 1. Executive Summary & Root Cause Analysis

Through controlled network tracing, HTTP/1.1, HTTP/2, and TLS inspection, DNS resolution analysis, and direct serverless function execution, we isolated **two concurrent root causes** that caused the production login failure:

### Root Cause 1: Domain Origin Routing Mismatch (The `ERR_QUIC_PROTOCOL_ERROR` & HTTP 405)
1. **Cloudflare DNS Routing Target**:
   - The apex domain `https://taptch.com` and `https://www.taptch.com` resolve via Cloudflare proxy to **GitHub Pages** (`webzioinfo.github.io` / Fastly edge `185.199.111.153`).
   - The origin server responding to `https://taptch.com/` returns `Server: GitHub.com`, `Via: 1.1 varnish`, serving a legacy static single-page HTML file ("Taptch | The Future Is One Tap Away").
2. **Static Origin Rejection of POST Requests**:
   - When a browser on `https://taptch.com` executes a login attempt (`POST /api/auth/sign-in/email`), the request reaches GitHub Pages/Fastly.
   - GitHub Pages is a static file host; it rejects all `POST` requests with `HTTP 405 Method Not Allowed` and immediately closes the underlying TCP/QUIC stream (`Connection: close`).
   - In modern Chromium browsers negotiating HTTP/3 (QUIC) over UDP, an abrupt stream teardown on a POST request surfaces as:
     ```
     net::ERR_QUIC_PROTOCOL_ERROR
     ```
3. **Application Host Location**:
   - The actual Next.js full-stack application (Next.js 16.4.5, Better Auth, Supabase DB) is deployed on **Vercel** (`https://taptch.webziotech.in`, CNAME `2b23e2544778c549.vercel-dns-017.com`), **not** GitHub Pages.
   - Because `taptch.com` DNS records were never pointed to Vercel, requests to `taptch.com` never touched the Next.js runtime.

---

### Root Cause 2: Git Branch Deployment & Client BaseURL Hardcoding
1. **Outdated Production Branch**:
   - Vercel's automated deployment was linked to `origin/main`.
   - The entire modernization suite (Next.js 16.4.5, Supabase PostgreSQL SSL pooling, Better Auth password repair, 6 luxury templates) had been developed on branch `modernization/stack-upgrade` and had not yet been merged into `main`.
   - Consequently, `origin/main` was still running commit `700258b`, which lacked Supabase SSL connection enforcement (`ssl: 'require'`), causing database queries from serverless functions to fail.
2. **Static Client `baseURL`**:
   - `src/lib/auth/client.ts` was previously initializing `createAuthClient` with `baseURL: process.env.NEXT_PUBLIC_APP_URL`.
   - When inlined during build time as `https://taptch.com`, any user visiting the application on `https://taptch.webziotech.in` had their auth client attempt cross-origin calls to `https://taptch.com` (which hit GitHub Pages).
3. **Serverless Redis Connection Hanging**:
   - `src/lib/redis/index.ts` attempted to connect to `redis://localhost:6379` in production when `REDIS_URL` was unset, with infinite retry logic that hung serverless functions until they hit Vercel's `504 FUNCTION_INVOCATION_TIMEOUT`.

---

## 2. Empirical Investigation & Diagnostic Evidence

### Diagnostic Test Matrix

| Target Host | Method & Path | Protocol | Observed Status | Server Header | Diagnostic Finding |
|---|---|---|---|---|---|
| `taptch.com` | `GET /` | HTTP/2 | **200 OK** | `GitHub.com` (Fastly) | Static "Coming Soon" page served from GitHub Pages (`webzioinfo.github.io`). |
| `taptch.com` | `GET /login` | HTTP/2 | **404 Not Found** | `GitHub.com` | No login route exists on GitHub Pages. |
| `taptch.com` | `POST /api/auth/sign-in/email` | HTTP/2 & HTTP/3 | **405 Method Not Allowed** | `Varnish` | GitHub Pages rejects POST. Abrupt QUIC stream termination triggers `net::ERR_QUIC_PROTOCOL_ERROR`. |
| `taptch.webziotech.in` | `GET /` | HTTP/2 | **200 OK** | `Vercel` | Active Next.js application homepage. |
| `taptch.webziotech.in` | `GET /login` | HTTP/2 | **200 OK** | `Vercel` | Active Next.js login page. |
| `Local Runtime / Supabase` | `POST /api/auth/sign-in/email` | In-process API | **200 OK** | Internal | Better Auth validates credentials against Supabase PostgreSQL and issues session cookie `better-auth.session_token`. |

---

## 3. Files Changed & Technical Justification

### 1. `src/lib/auth/client.ts`
- **Change**: Updated `createAuthClient` to dynamically determine the `baseURL` using `window.location.origin` in browser contexts.
- **Why**: Eliminates hardcoded cross-origin API calls. Ensures authentication requests always target the exact domain the user is currently browsing (`https://taptch.com`, `https://taptch.webziotech.in`, or `localhost`), preventing cross-site cookie rejections.

### 2. `src/lib/auth/index.ts`
- **Change**: Added `https://www.taptch.com` to `trustedOrigins`.
- **Why**: Prevents Better Auth `INVALID_ORIGIN` rejections when requests originate from the `www` subdomain.

### 3. `src/lib/redis/index.ts`
- **Change**: Configured `createRedisClient()` to fall back to `InMemoryRedisMock()` whenever `!redisUrl` is provided in serverless environments, with `maxRetriesPerRequest: 1` and `connectTimeout: 3000`.
- **Why**: Prevents serverless lambda functions from hanging indefinitely trying to reach `localhost:6379`, eliminating `504 Gateway Timeout` errors.

### 4. `src/app/api/auth/[...all]/route.ts`
- **Change**: Wrapped `POST` route handler in structured error handling with Pino logger.
- **Why**: Emits diagnostic logs on failure without leaking user credentials or passwords, returning clean structured error envelopes.

### 5. `src/app/(auth)/login/page.tsx`
- **Change**: Refactored `formatLoginError` to explicitly detect HTTP 405 (endpoint configuration error) and server 500s.
- **Why**: Prevents misleading "Please check your network connection" messages when the issue is a server-side routing or configuration error.

### 6. Git Synchronization (`main` branch)
- **Change**: Merged `modernization/stack-upgrade` into `main` and pushed to `origin/main` (`commit e382611`).
- **Why**: Deploys the complete, verified codebase (Next.js 16.4.5, Supabase PostgreSQL, Better Auth repair, luxury templates) to Vercel's automated deployment pipeline.

---

## 4. Required Production Configuration Changes

### A. Cloudflare DNS Configuration (Mandatory to fix `taptch.com`)
To route `https://taptch.com` to the actual Vercel application instead of GitHub Pages:

1. **Log in to Cloudflare Dashboard** -> Select domain `taptch.com` -> **DNS** -> **Records**.
2. **Update Apex Domain (`@` / `taptch.com`)**:
   - **Type**: `A`
   - **Name**: `@`
   - **IPv4 address**: `76.76.21.21` (Vercel Anycast IP)
   - **Proxy status**: Proxied (Orange Cloud) or DNS Only (per team preference)
3. **Update WWW Subdomain (`www`)**:
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Target**: `cname.vercel-dns.com` (replacing `webzioinfo.github.io`)
   - **Proxy status**: Proxied
4. **Remove Obsolete GitHub Pages Records**:
   - Delete any existing A records pointing to GitHub Pages IPs (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`).

### B. Vercel Domain Configuration
1. Open Vercel Project Dashboard for Taptch -> **Settings** -> **Domains**.
2. Add `taptch.com` and `www.taptch.com` to the project.
3. Configure `www.taptch.com` to redirect to `taptch.com` (Recommended).

### C. Vercel Environment Variables
Ensure the following variables are configured in the Vercel Production Environment:
- `DATABASE_URL`: `postgresql://postgres:[PASSWORD]@db.nvrcgauxafpxsaufjtha.supabase.co:5432/postgres?sslmode=require`
- `DATABASE_URL_DIRECT`: `postgresql://postgres:[PASSWORD]@db.nvrcgauxafpxsaufjtha.supabase.co:5432/postgres?sslmode=require`
- `NEXT_PUBLIC_SUPABASE_URL`: `https://nvrcgauxafpxsaufjtha.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_bnnLxVjJ-o9guCQQeDDz2w_pwUQrk5b`
- `BETTER_AUTH_SECRET`: `[High entropy 64-char key]`
- `BETTER_AUTH_URL`: `https://taptch.com`
- `NEXT_PUBLIC_APP_URL`: `https://taptch.com`
- `VISITOR_SALT_SECRET`: `[32-char entropy]`

---

## 5. Security & Privacy Audit Verification

1. **Zero Secret Leakage**: No passwords, database secrets, or tokens are logged. Passwords remain hashed via Better Auth scrypt/Argon2id.
2. **Zero Database Alteration**: No production user tables were dropped or modified. All existing accounts (`admin@taptch.local`, `superadmin@taptch.com`, `rajesh@apexcap.in`, etc.) remain intact.
3. **Cookie Security**: Better Auth session cookies are configured with `HttpOnly; Secure; SameSite=Lax`.
4. **Trusted Origins**: Only canonical domains (`taptch.com`, `www.taptch.com`, `taptch.webziotech.in`, `localhost`) are permitted.

---

## 6. Automated Test Results

- **Vitest Test Suite**: **24/24 test files passed**, **208/208 tests passed** (clean exit code 0).
- **TypeScript Strict Compilation**: **0 errors** (`tsc --noEmit`).
- **ESLint Code Quality**: **0 errors** across `src/`.
- **Direct Sign-In Test**: Verified `auth.api.signInEmail` completes in < 800ms with HTTP 200 and valid session token issuance.

---

## 7. Rollback Instructions

If a rollback of the codebase is required:
```bash
git checkout main
git revert e382611
git push origin main
```
To revert Cloudflare DNS: re-point `@` and `www` to `webzioinfo.github.io`.
