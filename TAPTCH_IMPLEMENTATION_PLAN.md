# TAPTCH — Master Implementation Plan & Execution Checklist

**Lifecycle States:** `Not Started` | `Investigating` | `Implementing` | `Testing` | `Verified` | `Blocked`

---

## Task Execution Matrix

| # | Task & Module | Status | Root Cause | Files Affected | Test Plan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **T1** | **Shared Profile Renderer Architecture** | `Implementing` | Builder was using hardcoded custom markup instead of `ProfileRenderer`. | `src/app/(app)/builder/[id]/page.tsx`, `src/components/templates/ProfileRenderer.tsx` | Vitest layout render tests, browser visual verification |
| **T2** | **Implement 6 Genuinely Distinct Luxury Templates** | `Implementing` | `apex-capital` missing layout; other templates lacked full UPI & 13-platform social support. | `src/components/templates/layouts/*.tsx`, `ProfileRenderer.tsx` | Unit tests for all 6 template layout renders |
| **T3** | **Visual Profile Style Studio & Customization in Builder** | `Implementing` | Theme tab only had a color picker and a link to `/templates`. | `src/app/(app)/builder/[id]/page.tsx` | Template switching test with state preservation |
| **T4** | **Template Switching & Safe Navigation Flow** | `Implementing` | Navigating to `/templates` did not pass `profileId` or return back to builder. | `src/app/(marketing)/templates/page.tsx`, `src/app/(marketing)/templates/[id]/page.tsx` | Navigation & URL query preservation tests |
| **T5** | **Mobile-First Responsive Hardening of All Templates** | `Implementing` | Fixed widths and unconstrained text caused potential clipping on small viewports. | `src/components/templates/layouts/*.tsx` | Responsive tests at 320px, 360px, 375px, 768px, 1280px |
| **T6** | **Image Upload System (Upload File or URL)** | `Implementing` | Builder avatar and cover inputs only accepted raw URLs. | `src/components/media/ImageUploadOrUrl.tsx`, `builder/[id]/page.tsx` | Drag-and-drop file upload & URL fallback test |
| **T7** | **Social Media 13-Platform Username & URL Normalization** | `Implementing` | Only 5 hardcoded inputs requiring full URLs without username normalization. | `src/lib/socials.ts`, `src/components/profile/SocialsEditor.tsx`, `builder/[id]/page.tsx` | Social normalization unit tests |
| **T8** | **UPI Payment & Dynamic QR Code Generation** | `Implementing` | No native UPI configuration or QR code generator for profile owners. | `src/lib/upi.ts`, `src/components/profile/UpiPaymentCard.tsx`, `builder/[id]/page.tsx` | UPI VPA validation & URI encoding tests |
| **T9** | **Profile Completion & Publishing Warnings Engine** | `Implementing` | Publishing was a single button click with no pre-flight quality checks. | `src/lib/validation/profile-completion.ts`, `builder/[id]/page.tsx` | Validation engine unit test |
| **T10** | **Environment Variables & Production Deployment Checklist** | `Implementing` | Need clean `.env.example`, variable reference, and zero secret leakage. | `.env.example`, `ENVIRONMENT_VARIABLES.md`, `PRODUCTION_DEPLOYMENT_CHECKLIST.md` | Env schema validation test |
| **T11** | **Automated Regression Test Suite & Production Verification** | `Not Started` | Need comprehensive test coverage for all new interactions and engines. | `tests/unit/*.test.ts` | Vitest, TypeScript, ESLint, Next.js build |
| **T12** | **Full Documentation & Final Reports** | `Not Started` | Master deliverable reports required. | `*.md` | Deliverables review |
