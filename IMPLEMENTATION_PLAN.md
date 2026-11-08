# TAPTCH — Architecture Implementation & Maintenance Plan

## 1. Overview & Architectural Directives
This implementation plan establishes the architectural governance, operational runbooks, and ongoing maintenance lifecycle for the TAPTCH SaaS platform and commercial sales campaigns.

---

## 2. Immediate & Completed Slices

### Slice 1: Rebranding & Brand Literal Isolation (COMPLETED)
- Purged all legacy brand variations from application code, documentation, and database schemas.
- Centralized all user-facing brands in `@/config/brand` and database `system_settings`.
- Established automated architectural regression tests to prevent hardcoded brand strings.

### Slice 2: Instagram NFC Card Commercial Campaign (COMPLETED)
- Implemented isolated modular campaign architecture under `src/campaigns/instagram-card/`.
- Configured dynamic `campaignBrandConfig` with zero parent brand exposure.
- Implemented high-concurrency ordering with atomic stock reservation and unique `idempotency_key` deduplication.
- Redesigned public storefront (`/campaigns/instagram-card`) into an Apple-inspired minimalist experience with photorealistic 3D card hardware visualizer, asymmetric collection layout, and tap simulator.

### Slice 3: Universal Input Contrast & Design Tokens (COMPLETED)
- Restored dual-theme compatibility across modern corporate light mode and Obsidian luxury dark mode.
- Aligned `src/components/ui/input.tsx` and `src/components/ui/textarea.tsx` with standard design tokens (`bg-card`, `caret-primary`, `text-foreground`).
- Universal form input contrast and WebKit autofill background protections verified via automated tests.

---

## 3. Medium-Term Roadmap (Phase 2)

1. **Automated Payment Gateway Integration:**
   - Integrate Razorpay / Cashfree webhook handlers and checkout modal triggers when payment gateway accounts are activated.
2. **Dynamic NFC Route Rewriting:**
   - Expand vanity short URL redirect cache via Redis cache-aside with sub-50ms TTL guarantees.
3. **Advanced Analytics Dashboard:**
   - Deliver real-time geocoding aggregation for NFC taps and QR scans without collecting personal identifiable information.

