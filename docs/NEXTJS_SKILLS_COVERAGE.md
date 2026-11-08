# Next.js 15 & React 19 Skills Technical Coverage Report

## 1. Executive Summary

This report documents the full coverage of **Next.js 15 App Router**, **React 19**, and **TypeScript 5.8+** within the Taptch Antigravity skills repository.

All skills adhere to the actual installed package versions in `package.json` (`next: ^15.5.0`, `react: ^19.0.0`, `typescript: ^5.8.2`, `drizzle-orm: ^0.45.4`).

---

## 2. Technical Coverage Matrix

| Next.js / Full-Stack Topic | Covered In Skill(s) | Version-Specific APIs & Guidance |
| :--- | :--- | :--- |
| **App Router Fundamentals** | `nextjs-app-router`, `nextjs-patterns` | `layout.tsx`, `template.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`. Route groups `(group)`, dynamic `[slug]`, catch-all `[...slug]`. |
| **Next.js 15 Asynchronous Parameters** | `nextjs-app-router`, `nextjs-api-routes`, `public-profile-seo` | `const { slug } = await params;` and `const query = await searchParams;`. Both are Promises in Next.js 15. |
| **React Server Components (RSC)** | `nextjs-server-components`, `react-architecture` | Server Component default, `'use client'` boundaries, data serialization constraints, composition via `children`, `server-only` isolation. |
| **Data Fetching & Caching** | `nextjs-data-fetching`, `performance-engineering` | Uncached by default in Next.js 15 (`no-store`), `force-cache`, time-based ISR (`revalidate: 3600`), cache tagging (`revalidateTag`, `updateTag`), request deduplication via React `cache()`. |
| **Server Actions & Mutations** | `nextjs-server-actions`, `backend-development` | `'use server'`, React 19 `useActionState`, `useOptimistic`, Zod validation, CSRF origin verification, server session resolution. |
| **Route Handlers & REST APIs** | `nextjs-api-routes`, `backend-development` | Standard API envelope `{ data, error, meta }`, HTTP methods (GET, POST, PATCH, DELETE), Edge vs Node.js runtime, streaming responses, rate limiting. |
| **Authentication & Authorization** | `backend-development`, `security-auditing`, `subscription-entitlements` | Better Auth session verification via request headers, tenant isolation with `withActor()`, `can()` permission engine, plan limit assertions (`assertWithinLimit`). |
| **React 19 Hooks & State** | `react-hooks`, `react-state-management`, `improve-react` | `use()`, `useActionState()`, `useOptimistic()`, closure safety, dependency array rules, Zustand store slicing, URL search params as state. |
| **TypeScript Strictness** | `typescript-strict-mode`, `software-engineering` | Strict mode flags, zero `any` policy, branded types (`UserId`, `ProfileId`), discriminated unions, Zod schema type inference (`z.infer`). |
| **SEO, Metadata & Social Previews** | `nextjs-metadata-and-seo`, `public-profile-seo` | Next.js Metadata API, dynamic `generateMetadata`, Open Graph, Twitter cards, `sitemap.ts`, `robots.ts`, Search Console coverage states. |
| **Core Web Vitals & Performance** | `performance-engineering`, `cost-reducer`, `improve-animations` | Sub-50ms Redis redirect caching, font optimization (`next/font`), image optimization (`next/image`), atomic JSON snapshot compilation. |
| **Taptch Domain Engines** | `digital-profile-engine`, `template-rendering-engine`, `subscription-entitlements`, `nfc-and-qr-engineering`, `public-profile-seo` | Personal vs business profiles, multi-business switcher tabs, 6 luxury templates (Obsidian, Ivory, Aurora, Zenith, Catalyst, Apex), 4-tier plan matrix (Nano, Micro, Mini, Max), NFC NTAG216 tokens, anti-metal ferrite shielding. |

---

## 3. Skills Taxonomy & Additions

### Newly Created Specialist Skills (14 Skills Added)
1. `nextjs-app-router`: Next.js 15 App Router architecture, file conventions, layouts, async params.
2. `nextjs-server-components`: React Server Components vs Client Components, boundaries, serialization.
3. `nextjs-data-fetching`: Next.js 15 data fetching models, request deduplication, cache tags, ISR.
4. `nextjs-server-actions`: Server Actions (`'use server'`), useActionState, useOptimistic, Zod.
5. `nextjs-api-routes`: Next.js 15 Route Handlers (`route.ts`), standard envelopes, edge runtimes.
6. `nextjs-metadata-and-seo`: Metadata API, dynamic Open Graph cards, sitemap.ts, robots.ts, GSC.
7. `react-architecture`: React 19 architecture, component design, composition over prop explosion.
8. `react-hooks`: React 19 hooks (`use`, `useActionState`, `useOptimistic`), closure safety.
9. `react-state-management`: Zustand store patterns, URL search parameters as state, Context isolation.
10. `typescript-strict-mode`: TypeScript 5.8+ strict engineering, branded types, discriminated unions.
11. `digital-profile-engine`: Personal vs business profiles, multi-business association, JSON snapshots.
12. `template-rendering-engine`: 6 luxury themes, dual-device live preview, theme token resolution.
13. `subscription-entitlements`: Taptch 4-tier plan matrix, resource limits, server-side permission gates.
14. `public-profile-seo`: Public profile SEO indexing, Zero Dynamic Hot Path on `/p/[slug]`, Open Graph.

### Pre-Existing Verified Skills (30 Skills Maintained)
- `backend-development`, `composio`, `cost-reducer`, `create-skill`, `customer-support`, `database-engineering`, `devops-and-deployment`, `frontend-design`, `frontend-development`, `impeccable`, `improve-animations`, `improve-react`, `improve-ui`, `know-me`, `n8n`, `nextjs-patterns`, `nfc-and-qr-engineering`, `performance-engineering`, `project-architecture`, `researcher`, `scalability`, `security`, `security-auditing`, `self-healing`, `software-engineering`, `supabase`, `supabase-postgres-best-practices`, `testing-and-quality`, `trigger-dev`, `ui-skills-root`.

---

## 4. Consolidations & Obsolete Material Handling

- **Legacy Next.js 14 Template (`template.md`)**: Flagged as legacy Next.js 14 template referencing Prisma and NextAuth. Superseded by native Taptch architecture (`nextjs-app-router`, `database-engineering` with Drizzle ORM, `backend-development` with Better Auth).
- **SEO & Routing Documentation (`seo-indexing.md`, `rooter.md`, `best-practice.md`)**: Fully absorbed and enhanced inside `nextjs-metadata-and-seo`, `public-profile-seo`, `nextjs-app-router`, `nextjs-server-components`, and `nextjs-data-fetching`.
- **Archive & Canonical Location**: All knowledge consolidated into canonical `.agents/skills/` with full historical archive stored in external backup.

