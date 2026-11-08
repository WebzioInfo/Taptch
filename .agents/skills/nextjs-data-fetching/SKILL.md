---
name: nextjs-data-fetching
description: "Master Next.js 15 data fetching, caching models, revalidateTag, request deduplication, ISR, and optimistic updates."
risk: safe
source: Taptch-core
date_added: "2026-11-02"
version: "1.0.0"
---

# Next.js 15 Data Fetching & Caching Architecture Skill

Engineering guide for fetching, caching, deduplicating, and revalidating data in Next.js 15 using Server Components, cache tags, and ISR.

---

## 1. When to Use This Skill

- Implementing server-side data fetching in Server Components.
- Configuring caching options (`force-cache`, `no-store`, `revalidate`).
- Invalidating and purging caches on demand via `revalidateTag` or `revalidatePath`.
- Request deduplication using React `cache()`.
- Building optimistic UI updates in React 19.

---

## 2. Next.js 15 Caching Paradigm Shift

In Next.js 15, `fetch` requests are **uncached by default** (`cache: 'no-store'` equivalent):

```ts
// Next.js 15: Fresh on every request by default
const res = await fetch('https://api.example.com/data');

// Explicitly opt-in to caching:
const cachedRes = await fetch('https://api.example.com/data', {
  cache: 'force-cache',
});

// Time-based Revalidation (ISR):
const isrRes = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 }, // Fresh for 1 hour
});

// Cache Tagging for on-demand invalidation:
const taggedRes = await fetch('https://api.example.com/templates', {
  next: { tags: ['templates'] },
});
```

---

## 3. Request Deduplication with React `cache()`

When reading data directly from a database ORM (Drizzle) or filesystem rather than `fetch()`, use React's `cache()` function to deduplicate calls within a single request lifecycle:

```ts
import { cache } from 'react';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { eq } from 'drizzle-orm';

/**
 * Deduplicated across layout, page, and generateMetadata in the same render
 */
export const getProfileCached = cache(async (slug: string) => {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.slug, slug))
    .limit(1);

  return profile ?? null;
});
```

---

## 4. Cache Invalidation Patterns

### On-Demand Tag Revalidation

When a user modifies their profile, invalidate the associated cache tag from a Server Action or Route Handler:

```ts
'use server';

import { revalidateTag, revalidatePath } from 'next/cache';

export async function publishProfileSnapshot(profileId: string, slug: string) {
  await compileProfileSnapshot(profileId);

  // Invalidate specific cache tags
  revalidateTag(`profile:${slug}`);
  revalidateTag('public-profiles');

  // Or revalidate specific route paths
  revalidatePath(`/p/${slug}`);
}
```

---

## 5. Client-Side Data Fetching (When Justified)

Use client-side fetching via TanStack Query (`@tanstack/react-query`) or standard `fetch` strictly when:
- Data changes rapidly in response to continuous user input (e.g. typing in a search input).
- Polling for live status updates (e.g. hardware order production status).
- Interacting with authenticated user session state.

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';

export function UserOrdersList() {
  const { data, isLoading } = useQuery({
    queryKey: ['user-orders'],
    queryFn: () => fetch('/api/v1/orders').then((r) => r.json()),
    refetchInterval: 10000, // Poll every 10 seconds
  });

  if (isLoading) return <div>Loading orders...</div>;
  return <div>{/* Render orders */}</div>;
}
```

---

## 6. Mandatory Engineering Rules

1. **Never Cache User-Private Data Globally**: Cache tags for user-specific data must be scoped to tenant/user IDs (e.g. `user:${userId}:orders`), never generic tags that leak data across users.
2. **Handle Loading & Error States**: Every async data fetch must have an accompanying fallback UI via `<Suspense>` or `loading.tsx`.
3. **No Waterfalls**: Parallelize independent fetch operations using `Promise.all([fetchA(), fetchB()])`.

