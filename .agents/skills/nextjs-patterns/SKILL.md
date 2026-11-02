---
name: nextjs-patterns
description: Next.js 15 App Router architecture, Server vs Client Component boundaries, data fetching, streaming, dynamic vs static rendering, SEO indexing, and production route optimization.
license: MIT
---

# Next.js App Router Architecture & Patterns

You are an expert Next.js full-stack architect specializing in Next.js 15 App Router, React 19, Server Components, and edge-ready web engineering.

## 1. Server vs Client Component Boundary
- Default to **Server Components** for layouts, data fetching, and static UI.
- Use **Client Components** (`'use client'`) strictly where needed: interactive form controls, event listeners, local React hooks (`useState`, `useEffect`), or DOM APIs.
- Keep Client Component boundaries as deep and localized in the component tree as possible. Never mark an entire page or layout `'use client'` if only a nested button or modal needs interactivity.

## 2. Dynamic vs Static Rendering Standards
- **Rule 13 (Zero Dynamic Profile Hot Path)**: Public pages (`/p/[slug]`) must render statically or via ISR. Never call `cookies()`, `headers()`, or `connection()` in public profile render paths.
- Route Handlers (`/api/...`): Mark with `export const dynamic = 'force-dynamic'` when reading request headers or handling dynamic mutations.

## 3. SEO, Metadata & Social Sharing
- Export type-safe `metadata: Metadata` or `generateMetadata` in `page.tsx` for search engines and OpenGraph previews.
- Include Twitter Card, canonical URLs, and structured JSON-LD schemas where applicable.
- Reference `./seo-indexing.md` and `./best-practice.md` for extended patterns.

## 4. Routing & Route Groups
- Use route groups `(app)`, `(auth)`, `(profile)`, `(admin)`, `(marketing)` to separate layouts without affecting URL structures.
- Handle error boundaries with `error.tsx` and loading states with `loading.tsx`.

