# Tappzio 360° Master Project Audit — 12: Prioritized Roadmap

**Focus:** Actionable Engineering & Product Roadmap (P0 to P4), Complexity Estimates, Milestone Sequence  
**Author:** CTO & Principal Software Architect  

---

## 1. Prioritized Findings & Remediation Register

| ID | Priority | Description | Affected Area | Est. Complexity | Status |
| :--- | :---: | :--- | :--- | :---: | :---: |
| **AUD-SEC-001** | **P0** | Next.js Edge Route Guard Middleware | `src/middleware.ts` | Medium | **Implemented** |
| **AUD-SEC-002** | **P1** | Environment Gating on Dev Utility Pages | `src/app/dev/*` | Low | **Implemented** |
| **AUD-ARCH-001** | **P2** | Prune Legacy Unused Supabase Wrappers | `src/utils/supabase/*` | Low | In Progress |
| **AUD-UI-001** | **P2** | Hardware-Accelerate Mobile Drawers | `src/components/layout/*` | Low | Planned |
| **AUD-UI-002** | **P3** | WCAG AAA Inactive Tab Token Alignment | `src/components/ui/tabs.tsx` | Low | Planned |
| **AUD-PERF-001** | **P3** | Dynamic Profile ETag & Stale-While-Revalidate | `src/app/(profile)/p/[slug]` | Medium | Planned |
| **AUD-FEAT-002** | **P4** | Multi-Language vCard Output (i18n names) | `src/modules/profiles/vcard.ts`| Low | Future |

---

## 2. Execution Milestone Plan

### Milestone 1: Security & Route Hardening (Current Execution)
- Implement `src/middleware.ts` with Better Auth cookie verification.
- Gate `/dev/gallery` and `/dev/supabase-test` with `notFound()` in production.
- Verify zero regression via Vitest test suite (`141/141 passing`).
- Verify production Next.js build compilation (`next build`).

### Milestone 2: Enterprise Team Analytics & Calendar Heatmap
- Expand `/portal-x/analytics` with GitHub-style luminous calendar heatmap for field agent card activations.
- Implement CSV export for high-volume enterprise card activation audits.

### Milestone 3: Phase-2 Commercial Gateway Integration (Deferred Post-Launch)
- Integrate Razorpay / Stripe enterprise checkout when business requires automated card self-checkout.
- Maintain data-driven manual entitlements as primary enterprise tier switch.

