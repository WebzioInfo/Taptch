# TAPTCH — Public Profile, NFC Redirect & Vercel Routing Root Cause Audit

**Date:** 2026-11-27  
**Status:** Investigation & Code Fixes Complete (Awaiting Production Push + Vercel Custom Domain Reassignment)

---

## 1. Executive Summary & Root Causes

Three distinct issues were identified and empirically verified across DNS/Vercel, React Router, and the NestJS NFC Resolver:

| Problem | Observed Symptom | Verified Root Cause |
|---|---|---|
| **1. Custom Domain 404** (`https://www.taptch.com/shareef`) | `404 NOT_FOUND` (`x-vercel-error: NOT_FOUND`), while `https://taptch.vercel.app/shareef` returns `200 OK` | `taptch.com` (`308` -> `https://www.taptch.com/`) is attached to an **old/separate Vercel project** serving a static coming-soon page (`<title>Taptch \| The Future Is One Tap Away</title>`, `last-modified: Fri, 27 Nov 2026 04:38:46 GMT`) with no SPA rewrite rules—**not** the `taptch` React/Vite SPA project (`taptch.vercel.app`). |
| **2. NFC Resolver Returns `not_found`** (`GET /api/v1/nfc/sinan/resolve`) | `{ status: "not_found", destinationType: null, destinationUrl: null }` | `CardsService.resolvePublicNfcToken()` only queried `cards.redirect_token` and `purchased_cards.redirect_token`. When a username/slug (e.g., `sinan`) was passed via `/p/sinan`, neither table had `redirect_token = 'sinan'`, returning `not_found`. |
| **3. `/p/:slug` vs `/:slug` Route Conflict** (`http://localhost:5173/p/sinan`) | `/p/sinan` rendered `NfcResolvePage` -> `"NFC card not recognized."` | `/p/:slug` was the legacy public profile route, later reassigned to `NfcResolvePage` (`/p/:uniqueKey`). Opening `/p/sinan` sent `sinan` as an NFC token to `/api/v1/nfc/sinan/resolve` instead of resolving the `sinan` profile. |

---

## 2. Vercel & Domain Configuration Findings

- **Apex & WWW Domain (`taptch.com` / `www.taptch.com`):**
  - Cloudflare proxies DNS for `taptch.com` (`172.67.170.90`, `104.21.47.36`).
  - `https://taptch.com/` returns `308 Permanent Redirect` -> `https://www.taptch.com/` (`x-vercel-id`).
  - `https://www.taptch.com/` returns `200 OK` with `<title>Taptch | The Future Is One Tap Away</title>`.
  - `https://www.taptch.com/shareef`, `/sinan`, `/login`, `/invalid-username-xyz` all return `404 Not Found` (`x-vercel-error: NOT_FOUND`).
- **Taptch React/Vite SPA (`taptch.vercel.app`):**
  - `https://taptch.vercel.app/` returns `200 OK` with `<title>TAPTCH — Professional Identity, One Link</title>`.
  - `https://taptch.vercel.app/sinan`, `/shareef`, `/login`, `/invalid-username-xyz` all return `200 OK` (`index.html`), and static assets (`/assets/index-DMY7DQnf.js`, `/manifest.webmanifest`) return `200 OK`.
- **Hardened `vercel.json` (Root & `frontend/`):**
  - Updated `vercel.json` and `frontend/vercel.json` to include `Cross-Origin-Opener-Policy: same-origin-allow-popups` and an explicit negative-lookahead SPA rewrite so `/api/` and static asset paths are never rewritten to `/index.html`:
    ```json
    "source": "/((?!api/|assets/|products/|favicon\\.ico|manifest\\.webmanifest|sw\\.js).*)",
    "destination": "/index.html"
    ```

---

## 3. Frontend Route Architecture

Inspected `frontend/src/routes/index.tsx`, `frontend/src/pages/PublicProfilePage.tsx`, `frontend/src/pages/NfcResolvePage.tsx`, and `frontend/src/config/reservedUsernames.ts`:

- **`/:slug`** (`PublicProfilePage`): Canonical public profile route for both personal and business profiles (`https://taptch.com/{username}`).
  - Extracts `slug`, validates against `isReservedUsername(slug)`, calls `GET /api/v1/profiles/by-slug/{slug}`, renders `ProfileRenderer`, handles `DRAFT`/unpublished states and branded 404.
- **`/p/:uniqueKey` & `/b/:uniqueKey` & `/nfc/:token`** (`NfcResolvePage`): Legacy NFC token resolution routes.
  - Calls `GET /api/v1/nfc/{uniqueKey}/resolve?type={personal|business}` and navigates directly to `/{profileSlug}` (or shows branded unconfigured/unavailable/not-found UI).
- **`/login`, `/register`, `/dashboard`, `/cards`, `/orders`, etc.**: Matched before `/:slug` in `createBrowserRouter` and listed in `RESERVED_USERNAMES`.

---

## 4. Profile API & Database Findings

- **Endpoint:** `GET /api/v1/profiles/by-slug/:slug` (`ProfilesController.getPublicProfile` -> `ProfilesService.findBySlug`), decorated with `@Public()` so `AuthGuard` never blocks logged-out requests.
- **Database Schema & Observed Records (PII redacted):**
  - `profiles`:
    - `slug = 'sinan'`, `status = 'PUBLISHED'`, `profile_type = 'personal'`, `username_locked = false`
    - `slug = 'shareef'`, `status = 'PUBLISHED'`, `profile_type = 'business'`, `username_locked = false`
    - `slug = 'profile-1794825761283'`, `status = 'DRAFT'`, `profile_type = 'business'`
  - `purchased_cards`:
    - `id = '1d82c97c-3e5a-4bc0-a181-900ef0b4327c'`, `profile_id = '47fc972f-32e1-48f8-8755-5c4ea3b4845a'`, `profile_username = 'sinan'`, `nfc_url = 'https://taptch.com/sinan'`, `redirect_token = '50f8b595acd3'`, `destination_type = 'profile'`, `profile_assignment_status = 'PROFILE_ATTACHED'`, `physical_card_id = null`
  - `cards` (provisioned physical inventory table): `[]` (0 rows).
- **Privacy Enforcement:** `ProfilesService.findBySlug()` strips private contact fields when `status` is `DRAFT` or non-public, returning only `{ id, slug, status }`.

---

## 5. NFC Resolution Fix Implemented

- **`backend/src/modules/cards/cards.service.ts` (`resolvePublicNfcToken`):**
  1. Checks `cards.redirect_token = cleanToken`.
  2. Checks `purchased_cards.redirect_token = cleanToken` (for `50f8b595acd3`, resolves to `/sinan`).
  3. **Added Step 3 (Legacy `/p/{username}` Fallback):** If no card token matches, looks up `profiles.slug` (and `username_aliases.alias`) case-insensitively. If found and published, returns `{ status: 'active', destinationType: 'profile', destinationUrl: '/{slug}', profileSlug, profileType }`; if unpublished, returns `unavailable`; otherwise `not_found`.
- **`backend/src/modules/cards/nfc-redirect.controller.ts` (`resolveNfcToken`):**
  - Forwarded `@Query('type')` to `cardsService.resolvePublicNfcToken(token, expectedType)`.
- **`backend/src/tests/nfc-destinations.test.ts`:**
  - Added unit test verifying legacy `/p/:slug` fallback resolution.

---

## 6. Production & API Test Results (Measured)

| Target | HTTP Status | Observed Result | Pass/Fail |
|---|---|---|---|
| `https://taptch.com/` | `308` | Redirects to `https://www.taptch.com/` | Info |
| `https://www.taptch.com/` | `200` | Serves old coming-soon HTML (`Taptch \| The Future Is One Tap Away`) | **FAIL (Domain Mismatch)** |
| `https://www.taptch.com/sinan` | `404` | Vercel `NOT_FOUND` (old project) | **FAIL (Domain Mismatch)** |
| `https://www.taptch.com/shareef` | `404` | Vercel `NOT_FOUND` (old project) | **FAIL (Domain Mismatch)** |
| `https://taptch.vercel.app/` | `200` | Serves Taptch React SPA (`TAPTCH — Professional Identity, One Link`) | **PASS** |
| `https://taptch.vercel.app/sinan` | `200` | Serves SPA `index.html` for `PublicProfilePage` | **PASS** |
| `https://taptch.vercel.app/shareef` | `200` | Serves SPA `index.html` for `PublicProfilePage` | **PASS** |
| `https://taptch.vercel.app/invalid-username-xyz` | `200` | Serves SPA `index.html` (renders branded Not Found) | **PASS** |
| `https://taptch.vercel.app/login` | `200` | Serves SPA `index.html` | **PASS** |
| `https://taptch.vercel.app/assets/index-DMY7DQnf.js` | `200` | Static JS bundle served directly | **PASS** |
| `https://api.taptch.com/api/health` | `200` | Backend healthy (`database.connected: true`) | **PASS** |
| `https://api.taptch.com/api/v1/profiles/by-slug/sinan` | `200` | Returns `sinan` personal profile JSON | **PASS** |
| `https://api.taptch.com/api/v1/profiles/by-slug/shareef` | `200` | Returns `shareef` business profile JSON | **PASS** |
| `https://api.taptch.com/api/v1/profiles/by-slug/invalid-username-xyz` | `404` | Returns `Profile "invalid-username-xyz" not found.` | **PASS** |
| `https://api.taptch.com/api/v1/profiles/by-slug/profile-1794825761283` | `200` | Returns `{ id, slug, status: "DRAFT" }` (no private data) | **PASS** |
| `https://api.taptch.com/api/v1/nfc/50f8b595acd3/resolve` | `200` | Returns `{ status: "active", destinationUrl: "/sinan", profileSlug: "sinan" }` | **PASS** |
| `https://api.taptch.com/api/v1/nfc/sinan/resolve` (pre-deploy) | `200` | Returned `not_found` before backend fix; fixed locally & unit-tested | **Fixed Locally (Awaiting Deploy)** |

---

## 7. Files Modified

- `vercel.json`
- `frontend/vercel.json`
- `backend/src/modules/cards/cards.service.ts`
- `backend/src/modules/cards/nfc-redirect.controller.ts`
- `backend/src/tests/nfc-destinations.test.ts`
- `TAPTCH_PUBLIC_PROFILE_AND_NFC_REDIRECT_ROOT_CAUSE_AUDIT.md`

---

## 8. Required Manual Deployment Steps

1. **Deploy Updated Backend & Frontend:** Push the updated branch to GitHub (or deploy via Vercel CLI) so `api.taptch.com` receives the `resolvePublicNfcToken` profile-slug fallback and `taptch.vercel.app` receives the hardened `vercel.json`.
2. **Reassign `taptch.com` & `www.taptch.com` in Vercel Dashboard:**
   - Open the old "coming soon" Vercel project -> **Settings -> Domains** -> Remove `taptch.com` and `www.taptch.com`.
   - Open the **`taptch` React/Vite SPA Vercel project** (serving `taptch.vercel.app`) -> **Settings -> Domains** -> Add `taptch.com` and `www.taptch.com`.
   - Do **not** alter Cloudflare nameservers.
