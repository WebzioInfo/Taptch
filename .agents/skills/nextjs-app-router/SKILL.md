---
name: nextjs-app-router
description: "Master Next.js 15 App Router architecture, file conventions, layouts, templates, error boundaries, parallel routes, and intercepting routes."
risk: safe
source: Tappzio-core
date_added: "2026-11-02"
version: "1.0.0"
---

# Next.js 15 App Router Architecture Skill

Comprehensive guide and architectural standard for developing with the **Next.js 15 App Router** using React 19, TypeScript strict mode, and production-grade routing conventions.

---

## 1. When to Use This Skill

- Structuring Next.js App Router applications (`src/app/`).
- Implementing nested layouts, persistent shells, and dynamic pages.
- Handling asynchronous route props (`params` and `searchParams` as Promises in Next.js 15).
- Configuring loading skeletons, error boundaries, and 404 handlers.
- Implementing route groups `(group)`, parallel routes `@slot`, and intercepting routes `(.)`.
- Setting up static rendering, dynamic rendering, and ISR.

---

## 2. Core File Conventions

Every folder under `src/app/` represents a URL path segment. The special file conventions determine the rendered UI:

| File | Responsibility | Server / Client |
| :--- | :--- | :--- |
| `layout.tsx` | Shared UI wrapper across routes; preserves state across navigation | Server (default) or Client |
| `template.tsx` | Similar to layout, but re-mounts on every navigation (new state) | Server (default) or Client |
| `page.tsx` | Unique UI for the route; makes the path publicly accessible | Server (default) or Client |
| `loading.tsx` | Instant loading UI rendered via React Suspense boundary | Server Component |
| `error.tsx` | Catches runtime errors in nested subtree; provides retry fallback | **Must be Client Component** (`'use client'`) |
| `not-found.tsx` | Rendered when `notFound()` is thrown or route is unmapped | Server Component |
| `default.tsx` | Fallback UI for unmatched parallel route slots | Server Component |
| `route.ts` | API endpoint handler (Route Handler); mutually exclusive with `page.tsx` | Server (Edge or Node.js) |

---

## 3. Next.js 15 Breaking Changes & Conventions

### Asynchronous `params` and `searchParams`

In Next.js 15, `params` and `searchParams` are delivered as **Promises** to allow the framework to optimize rendering before params resolve:

```tsx
// Server Component Page (Next.js 15)
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  return <div>Viewing {slug} with filter {query.tab}</div>;
}
```

### Route Handlers with Async Params

```ts
// src/app/api/v1/profiles/[id]/route.ts
interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  return Response.json({ id });
}
```

---

## 4. Route Organization Patterns

### Route Groups `(folder)`

Use parentheses to organize routes without affecting the URL path:

```text
src/app/
├── (marketing)/       # Marketing layout (Hero, Public Header, Footer)
│   ├── page.tsx       # URL: /
│   └── pricing/
│       └── page.tsx   # URL: /pricing
├── (app)/             # Authenticated shell layout (Sidebar, Notifications)
│   ├── dashboard/
│   │   └── page.tsx   # URL: /dashboard
│   └── cards/
│       └── page.tsx   # URL: /cards
└── (profile)/         # Zero Dynamic Hot Path layout
    └── p/
        └── [slug]/
            └── page.tsx # URL: /p/:slug
```

### Dynamic Routes & Catch-Alls

- `[slug]`: Single dynamic parameter (e.g. `/p/aditya`).
- `[...slug]`: Catch-all parameter (e.g. `/docs/a/b/c` -> `slug: ['a', 'b', 'c']`).
- `[[...slug]]`: Optional catch-all (matches `/docs` as well as `/docs/a/b`).

---

## 5. Parallel & Intercepting Routes

### Parallel Routes (`@slot`)

Renders multiple pages simultaneously in the same layout:

```tsx
// src/app/(app)/layout.tsx
export default function AppLayout({
  children,
  analytics,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
}) {
  return (
    <div className="flex">
      <main>{children}</main>
      <aside>{analytics}</aside>
    </div>
  );
}
```

Always provide a `default.tsx` fallback for each parallel slot to prevent 404s on hard page refreshes.

### Intercepting Routes

Intercept routes to display preview modals while preserving shareable URLs:
- `(.)`: Intercepts same level
- `(..)`: Intercepts one level up
- `(..)(..)`: Intercepts two levels up
- `(...)`: Intercepts from root `app`

---

## 6. Mandatory Engineering Rules

1. **Keep Layouts Thin**: Layouts must not fetch route-specific data that causes unnecessary waterfalls. Colocate data fetching in `page.tsx` or Server Component leaf nodes.
2. **Handle Errors Defensively**: Every user-facing route group must include an `error.tsx` client boundary with a diagnostic message and retry button.
3. **No Direct Database Client in Pages**: Follow clean architecture — page components must invoke domain services or API endpoints, never raw `db` queries directly.
4. **Never Force Dynamic on Public Profile Hot Paths**: Routes like `/p/[slug]` must never import `cookies()` or `headers()` that force server re-computation on every tap.

---

## 7. Anti-Patterns to Avoid

- **`useSearchParams()` without Suspense**: Using `useSearchParams()` in a Client Component without wrapping it in `<Suspense>` forces the entire page into client-side rendering.
- **Over-nesting Layouts**: Creating layouts deeper than 3 levels causes severe DOM tree nesting and hydration overhead.
- **Missing `key` on Template**: If state reset is desired on route change, use `template.tsx` instead of hacky `useEffect` listeners in `layout.tsx`.

