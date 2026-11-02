# Next.js 15 App Router Engineering Standards

## 1. App Router & Asynchronous Parameters
- All routes reside under `src/app/`.
- In Next.js 15, `params` and `searchParams` in Page, Layout, and Route Handler components are **Promises** and must be resolved with `await params`.
- Special file conventions (`layout`, `page`, `loading`, `error`, `not-found`, `route`) must adhere strictly to their defined responsibilities.

## 2. Server Components First
- Default to React Server Components (RSC).
- Add `'use client'` strictly to interactive leaf components requiring browser APIs, event handlers, or React state hooks.
- Props crossing the network boundary between Server and Client Components must be strictly serializable.
- To prevent accidental leakage of sensitive database clients or environment secrets, import `server-only` in server modules.

## 3. Zero Dynamic Profile Hot Path
- High-volume public profile routes (`src/app/(profile)/p/[slug]/page.tsx`) must **NEVER** import `cookies()`, `headers()`, or `connection()`.
- Public profiles must read pre-compiled `published_json` snapshots from the database or Redis edge cache.

## 4. Server Actions & Mutations
- Use `'use server'` Server Actions for form submissions and mutations, paired with React 19 `useActionState` and `useOptimistic`.
- Server Actions must validate all input with Zod and resolve actor identity from session cookies, never from user-supplied form fields.
- Business logic must live in domain services under `src/modules/<domain>/`, not duplicated inside action or route files.

## 5. SEO & Metadata
- Public routes must define static `metadata` or dynamic `generateMetadata` declaring explicit canonical URLs and Open Graph tags.
- Private routes (`/dashboard`, `/builder`, `/admin`) must be blocked in `robots.ts` and marked with `noindex, nofollow`.

