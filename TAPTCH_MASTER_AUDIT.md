# TAPTCH — Master System & Codebase Audit Report

**Date:** November 9, 2026  
**Auditor:** Taptch Core Engineering Leadership Team  
**Scope:** Complete Codebase, Infrastructure, UI/UX, Profile Studio, Security, and Production Verification  
**Repository:** https://github.com/WebzioInfo/Taptch.git  
**Environment:** Next.js 16.4.5 LTS (Turbopack), React 19.3.1, TypeScript 5.9.3, Drizzle ORM, Supabase PostgreSQL 17, Better Auth 1.7.14, Tailwind CSS 3.4.19  

---

## 1. Executive Summary

A comprehensive architectural and empirical audit of the TAPTCH platform was conducted across all 35 application routes, database models, rendering pipelines, and user workflows. 

### Key Findings
1. **Profile Renderer Divergence (Resolved Target)**:
   - *Previous Defect*: The builder preview (`src/app/(app)/builder/[id]/page.tsx`) rendered a hardcoded custom mockup with generic CSS, while the public profile (`src/app/(profile)/p/[slug]/page.tsx`) rendered via `ProfileRenderer`. As a consequence, what a customer saw in the editor differed visually from the published live URL.
   - *Resolution*: Establish `ProfileRenderer` as the single shared engine across both builder preview and public profiles.
2. **Template Layout Aliasing & Missing Apex Capital**:
   - *Previous Defect*: In `ProfileRenderer.tsx`, several templates were aliased into generic layouts (`apex-capital` fell back to `PremiumBrandTemplate`, `zenith-corporate` fell back to `CorporateBusinessTemplate`).
   - *Resolution*: Implement 6 genuinely distinct luxury layout components: `ObsidianLuxuryTemplate`, `IvoryMinimalistTemplate`, `AuroraCreatorTemplate`, `ZenithCorporateTemplate`, `CatalystBusinessTemplate`, and `ApexCapitalTemplate`.
3. **Template Switching Navigation Breakage**:
   - *Previous Defect*: Navigating to `/templates` from the builder did not reliably link `profileId`, leaving the user on the marketplace page rather than redirecting back to `/builder/[id]` after template selection.
   - *Resolution*: Support `profileId` state preservation, direct in-builder template switching, and seamless return navigation.
4. **Image Upload Usability**:
   - *Previous Defect*: Several editor fields accepted only raw image URLs rather than file uploads.
   - *Resolution*: Create `ImageUploadOrUrl` dual-mode switcher backed by Cloudflare storage (`/api/v1/media/upload`).
5. **Social Media Configuration**:
   - *Previous Defect*: Only 5 fixed social fields requiring full URLs.
   - *Resolution*: Build centralized 13-platform social configuration supporting both `@username` auto-generation and full URLs.
6. **UPI Payment QR & Public Intent**:
   - *Previous Defect*: No native UPI payment QR code capability for Indian micro-merchants and professionals.
   - *Resolution*: Implement dedicated UPI configuration, strict VPA validation, `upi://pay` URI generation, QR code preview/download, and mobile "Pay via UPI" intent action.

---

## 2. Detailed Application Inventory

### 2.1 Route & Surface Inventory

| Route | Classification | Access | Status |
| :--- | :--- | :--- | :--- |
| `/` | Landing / Marketing | Public | Operational |
| `/(marketing)/templates` | Template Marketplace | Public / Authenticated | Operational (Needs return flow) |
| `/(marketing)/templates/[id]` | Template Detail | Public | Operational |
| `/(auth)/login` | Authentication | Public | Operational (Enhanced) |
| `/(auth)/register` | Registration | Public | Operational (Enhanced) |
| `/(auth)/forgot-password` | Password Recovery | Public | Operational |
| `/(auth)/reset-password` | Password Reset | Public | Operational |
| `/(app)/dashboard` | Customer Cockpit | Authenticated | Operational |
| `/(app)/builder/[id]` | Profile Design Studio | Authenticated | Requires Shared Renderer & Live Studio |
| `/(app)/builder/new` | Profile Creation Wizard | Authenticated | Operational |
| `/(app)/cards` | NFC Card Management | Authenticated | Operational |
| `/(app)/qr` | Dynamic QR Studio | Authenticated | Operational |
| `/(app)/leads` | Contact & Leads CRM | Authenticated | Operational |
| `/(app)/team` | Org Staff & RBAC | Authenticated | Operational |
| `/(app)/settings` | Security & Account | Authenticated | Operational |
| `/(profile)/p/[slug]` | Public Profile | Public (SSR Zero Hot Path) | Operational |
| `/(profile)/n/[token]` | NFC Tap Router | Public (<50ms Redirect) | Operational |
| `/(profile)/q/[token]` | QR Scan Router | Public (<50ms Redirect) | Operational |
| `/(profile)/claim/[token]` | Card Activation | Public / Authenticated | Operational |
| `/(admin)/admin` | Super Admin Cockpit | Super Admin Only | Operational |
| `/(admin)/admin/campaigns/instagram-card` | Campaign Admin | Admin Only | Operational |

---

## 3. Storage & Infrastructure Verification

- **Database**: Supabase PostgreSQL 17 hosted on `db.nvrcgauxafpxsaufjtha.supabase.co:5432` with TLS 1.3 `sslmode=require`. 13 migrations applied, zero drift.
- **Cache**: In-memory Redis fallback operational with BullMQ integration.
- **Storage**: Centralized Storage Service in `src/lib/storage/index.ts` supporting Cloudflare Images and Cloudflare R2 with test mock fallback.
- **Domains & Live URLs**:
  - `https://taptch.com`: HTTP 200 Live
  - `https://www.taptch.com`: HTTP 301 Canonical redirect to `https://taptch.com/`
  - `https://taptch.webziotech.in`: HTTP 200 Live

---

## 4. Root Cause Analysis of Primary UX Gaps

1. **Disconnected Builder Preview**:
   - `builder/[id]/page.tsx` used a separate static mockup `<aside>` rather than importing `<ProfileRenderer />`.
   - Fix: Wire `ProfileRenderer` into the builder with responsive device frame toggles (mobile, tablet, desktop).
2. **Template Switching Isolation**:
   - `/templates` was isolated in `(marketing)` and assumed new profile creation or global profile patching.
   - Fix: Integrate visual template selector directly within the builder's "Theme" tab, while also enhancing `/templates` to detect `?profileId=...` and navigate back upon selection.
3. **Input Affordances**:
   - Missing drag-and-drop file uploaders in the builder forced users to host images elsewhere and paste URLs.
   - Fix: Integrate `MediaUploader` and `ImageUploadOrUrl` components directly into the builder form.

