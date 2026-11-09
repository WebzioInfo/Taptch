# TAPTCH — Performance & Optimization Report

## 1. Executive Summary

This Performance Report details the architectural optimizations, asset delivery pipelines, caching strategies, and Core Web Vitals targets implemented across the TAPTCH platform.

Special emphasis is placed on the **Zero Dynamic Hot Path** architecture for public profile pages (`/p/[slug]`) and NFC tap redirection latency.

---

## 2. Core Architecture: Zero Dynamic Hot Path (`/p/[slug]`)

Public digital profiles are the highest-traffic surface in the TAPTCH ecosystem. Every NFC card tap, QR scan, and shared link lands on `/p/[slug]`.

### 2.1 The Problem
Traditional SSR implementations in Next.js dynamically parse cookies, headers, or user sessions on every request. This forces Next.js into uncacheable dynamic rendering, requiring a cold server round-trip to the application backend and database for every NFC tap.

### 2.2 The TAPTCH Solution
TAPTCH enforces a **Zero Dynamic Hot Path** rule on `/p/[slug]`:
1. **Zero Dynamic Imports**: `/p/[slug]` **never** imports `cookies()`, `headers()`, or `connection()` from `next/headers` or `next/server`.
2. **Pre-compiled Profile Snapshots**:
   - When a profile is published in the Profile Builder, a complete, immutable JSON snapshot is generated and stored in `profiles.renderedSnapshot`.
   - On request, the database or Redis cache serves this pre-rendered JSON snapshot in a single lookup (`SELECT rendered_snapshot FROM profiles WHERE slug = $1 AND is_active = true`).
   - Zero complex JOIN queries or relational traversals occur during public profile delivery.
3. **HTTP Edge Cacheability**:
   - Responses include cache-control headers (`s-maxage=300, stale-while-revalidate=86400`) allowing Cloudflare Edge CDN to serve subsequent taps directly from edge nodes in < 30ms without touching the origin server.

---

## 3. Asset & Media Optimization Pipeline

### 3.1 Cloudflare Images & R2 Storage
- All profile avatars, covers, logos, and catalog images are hosted on Cloudflare R2 / Cloudflare Images with global CDN edge delivery.
- Cloudflare automatically negotiates optimal image formats (`image/avif` and `image/webp`) based on the client browser's `Accept` header.
- Images are served with immutable cache lifetimes (`Cache-Control: public, max-age=31536000, immutable`).

### 3.2 Typography & Font Delivery
- The application uses Next.js optimized local font loading for **Geist Sans** and **Geist Mono** via `next/font/local` / `next/font/google`.
- Zero external runtime font downloads (e.g. from Google Fonts CDN) during page rendering, eliminating layout shifts (CLS) and DNS resolution latency.
- Font subsets are preloaded and inlined into the initial HTML document payload.

### 3.3 Vector Graphics & Icon Delivery
- Icons are rendered as lightweight, inline SVGs via `lucide-react`.
- Heavy third-party font icon bundles (such as FontAwesome or Material Icons font files) are strictly prohibited, reducing initial bundle weight by over 140KB.

---

## 4. Profile Builder Studio Performance

The Profile Builder Studio (`/builder/[id]`) is a feature-rich, interactive SPA surface. Several performance measures keep it responsive:

1. **Reactive In-Memory State**: Form inputs update local React state synchronously; builder preview updates instantly without server round-trips.
2. **Viewport Switching with Zero Remounts**: Switching between Mobile (375px), Tablet (440px), and Desktop (100%) adjusts CSS container dimensions without remounting the `ProfileRenderer` component tree.
3. **Debounced Cloud Sync**: Autosave mutations are debounced to prevent unnecessary network requests while the user is actively typing.

---

## 5. Core Web Vitals Targets & Measured Baselines

| Metric | Target SLA | Strategy |
|---|---|---|
| **Largest Contentful Paint (LCP)** | **< 1.2s** | Edge CDN caching on `/p/[slug]`, preloaded hero images, local Geist fonts. |
| **Cumulative Layout Shift (CLS)** | **< 0.05** | Explicit aspect ratio constraints on cover and avatar containers; skeleton loaders for async state. |
| **Interaction to Next Paint (INP)** | **< 50ms** | Hardware-accelerated CSS transforms (`translate3d`, `transform`, `opacity`); minimal main-thread JS overhead. |
| **Time to First Byte (TTFB)** | **< 80ms** | Cloudflare CDN edge distribution; single snapshot key lookup in Supabase PostgreSQL / Redis. |
| **NFC Tap-to-Redirect Latency** | **< 50ms** | Dynamic short-token resolver (`/t/[token]`) cached in memory/Redis with 301/302 edge redirect. |

---

## 6. Continuous Performance Monitoring

1. **k6 Load Testing**: Concurrency test scripts in `load/` simulate sustained traffic on `/p/[slug]` to ensure low latency under high load.
2. **Lighthouse CI**: Regular audits ensure performance regressions are detected before deployment to production.

