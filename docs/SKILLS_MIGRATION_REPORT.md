# Tapzio Skills Migration & Reorganization Report

## 1. Migration Overview & Historical Context

This document provides the authoritative, unified record of the migration, expansion, and reorganization of skills within the Tapzio repository.

- **Initial Skills Migration**: October 31, 2026 (12 initial skills migrated from reference sources).
- **Next.js & Domain Expansion**: November 02, 2026 (expansion to 44 production-grade specialist skills).
- **Canonical Destination Directory**: `D:\Webzio\Tapzio\.agents\skills`
- **Total Registered Skills**: 44
- **Discovery Architecture**: Flat single-level directory structure (`.agents/skills/<skill-name>/SKILL.md`) ensuring native discovery by Antigravity and Claude Code.

---

## 2. Complete Source-to-Canonical Skill Mapping

| Original Source | Canonical Destination in `.agents/skills/` | Architectural Action Taken |
| :--- | :--- | :--- |
| `Skills/nextjs/nextjs-approuter.md` + `rooter.md` | `.agents/skills/nextjs-app-router/` | Consolidated, updated for Next.js 15 async params, and registered. |
| `Skills/nextjs/best-practice.md` | `.agents/skills/nextjs-server-components/` & `nextjs-data-fetching/` | Extracted into focused Server Components and data fetching skills. |
| `Skills/nextjs/seo-indexing.md` | `.agents/skills/nextjs-metadata-and-seo/` & `public-profile-seo/` | Enhanced with Next.js 15 `generateMetadata` and Search Console guidance. |
| `Skills/improve-react-ui.md` | `.agents/skills/improve-react/` & `react-architecture/` | Restructured for React 19 architecture and hook patterns. |
| `Skills/skillsforcodewriting.md` | `.agents/skills/software-engineering/` | Re-verified SOLID and Clean Code practices. |
| `Skills/skillsforprojectsetup.md` | `.agents/skills/project-architecture/` | Preserved modular monolith and folder structure rules. |
| `Skills/impeccable/` | `.agents/skills/impeccable/` | Full tree of 40+ supporting references and scripts preserved. |
| `Skills/ui-skill-root.md` | `.agents/skills/ui-skills-root/` | Preserved UI routing layer. |
| `Skills/frontend-design.md` | `.agents/skills/frontend-design/` | Consolidated complete studio design and copywriting standards. |
| `Skills/improve-animations.md` | `.agents/skills/improve-animations/` | Consolidated complete motion design and audit standards. |
| `Skills/improve-ui.md` | `.agents/skills/improve-ui/` | Consolidated UI surface audit standards and 3-proof verification. |

---

## 3. Conflict Identification & Reconciliation Record

1. **BullMQ Worker Decoupling vs. Trigger.dev / n8n**:
   - *Analysis*: Imported skills emphasized Trigger.dev and n8n for background automation, while Tapzio architecture mandates BullMQ in a decoupled container for high-throughput NFC analytics ingestion and batching.
   - *Resolution*: BullMQ remains the internal production workhorse for high-frequency redirects, analytics, and vCard export. Trigger.dev and n8n provide patterns for external third-party integrations, webhook relays, and cloud serverless jobs.
2. **Generic Application Security vs. Tapzio Multi-Tenant RLS & Indian DPDP Act**:
   - *Analysis*: Generic `security` skill covers web/desktop vulnerabilities (XSS, CSRF, Tauri IPC), but lacks PostgreSQL transaction-scoped RLS (`prepare: false`) and Indian DPDP 2023 regulations (24h rotating salt IP hashing).
   - *Resolution*: Preserved `security` as the comprehensive application security reference, while maintaining `security-auditing` and `database-engineering` as the Tapzio-specific operational standards.
3. **Frontend Design Aesthetics vs. Frontend Implementation**:
   - *Analysis*: `frontend-design` focuses on creative direction and anti-slop guidelines, while `frontend-development` focuses on Next.js 15 App Router, React 19, Tailwind, and Zustand state.
   - *Resolution*: Maintained both as complementary skills: `frontend-design` provides aesthetic direction during layout and typography selection; `frontend-development` provides architectural and code-level implementation guidance.

---

## 4. Newly Created Domain & Specialist Skills (14 Skills)

1. **`digital-profile-engine`**: Personal vs business profiles, multi-business association (`profile_businesses`), section layout, atomic JSON snapshots.
2. **`template-rendering-engine`**: 6 luxury templates (Obsidian, Ivory, Aurora, Zenith, Catalyst, Apex), dual-device previewing, theme swatches.
3. **`subscription-entitlements`**: 4-tier plan matrix (Nano, Micro, Mini, Max), resource limits enforcement (`assertWithinLimit`), permission gates (`can()`).
4. **`public-profile-seo`**: Public profile indexing rules, Zero Dynamic Hot Path architecture on `/p/[slug]`, Open Graph sharing cards.
5. **`nextjs-app-router`**: Next.js 15 App Router layout hierarchy, async params/searchParams, and route groups.
6. **`nextjs-server-components`**: RSC vs Client boundaries, serialization limits, `server-only` isolation.
7. **`nextjs-data-fetching`**: Uncached fetch defaults, React `cache()` request deduplication, on-demand `revalidateTag` ISR.
8. **`nextjs-server-actions`**: Server Actions (`'use server'`), useActionState, useOptimistic, Zod validation, CSRF safety.
9. **`nextjs-api-routes`**: Route Handlers (`route.ts`), standard envelopes, edge vs node runtimes.
10. **`nextjs-metadata-and-seo`**: Dynamic metadata API, dynamic Open Graph cards, sitemap.ts, robots.ts.
11. **`react-architecture`**: Component composition, presentation/container separation, custom hook standards.
12. **`react-hooks`**: React 19 hooks (`use`, `useActionState`, `useOptimistic`), closure safety, dependency array rules.
13. **`react-state-management`**: Zustand store design, React Context performance isolation, URL search parameters as state.
14. **`typescript-strict-mode`**: TypeScript 5.8+ strict engineering, branded types, discriminated unions, zero `any` policy.

---

## 5. Antigravity Discovery Verification

- All 44 skills reside directly in `.agents/skills/<skill-name>/SKILL.md`.
- No nested skill directories (satisfies Antigravity's single-level folder discovery convention).
- All 44 `SKILL.md` manifests contain valid YAML frontmatter (`name`, `description`).
- `skills-lock.json` updated with SHA-256 cryptographic hashes for all 44 skills.
