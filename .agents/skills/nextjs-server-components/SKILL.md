---
name: nextjs-server-components
description: "Master React Server Components (RSC), Client Component boundaries, data serialization, Suspense streaming, and server-only isolation."
risk: safe
source: Tappzio-core
date_added: "2026-11-02"
version: "1.0.0"
---

# React Server Components (RSC) Architecture Skill

Architectural guide for leveraging React Server Components in Next.js 15, designing component boundaries, preventing data leakage, and implementing Suspense streaming.

---

## 1. When to Use This Skill

- Deciding between Server Components and Client Components.
- Structuring component trees with minimal JavaScript bundle size.
- Using Suspense boundaries for progressive streaming SSR.
- Passing data across the Server-to-Client serialization boundary.
- Enforcing server-only code isolation (`import 'server-only'`).

---

## 2. Server vs Client Component Decision Matrix

```text
Does the component need...?
├── Interactivity (onClick, onChange, onSubmit)?
│   └── Client Component ('use client')
├── Browser APIs (localStorage, window, navigator, geolocation)?
│   └── Client Component ('use client')
├── React State or Lifecycle Hooks (useState, useReducer, useEffect)?
│   └── Client Component ('use client')
├── Direct access to backend resources (database, secrets, internal APIs)?
│   └── Server Component (default)
├── Heavy npm libraries without browser UI impact (markdown parsers, date formatters)?
│   └── Server Component (keeps bundle size 0 kB on client)
└── Both?
    └── Split: Server Component fetches data -> passes serializable props to Client Component
```

---

## 3. The Serialization Boundary

Props passed from a Server Component to a Client Component across the network boundary **must be serializable**:

### Allowed Types
- Primitives (`string`, `number`, `boolean`, `null`, `undefined`)
- Plain JavaScript objects & arrays
- Promises (can be unwrapped on the client using React 19 `use()`)
- Server Actions (`async function`)

### Prohibited Types
- Functions / event handlers (e.g. `onClick={() => {}}`)
- Class instances with methods (e.g. `new Date()`, `Map`, `Set`, custom Error instances)
- Symbol primitives

```tsx
// Server Component (Parent)
import { UserAvatarClient } from './UserAvatarClient';

export default async function UserProfileCard({ userId }: { userId: string }) {
  const user = await getUser(userId);

  return (
    <div>
      {/* user.createdAt must be serialized to ISO string or timestamp */}
      <UserAvatarClient
        name={user.name}
        joinedDate={user.createdAt.toISOString()}
      />
    </div>
  );
}
```

---

## 4. Composition Pattern: Passing Server Components as Children

To render a Server Component inside a Client Component without turning the Server Component into a Client Component, pass it as `children`:

```tsx
// Client Component: ModalShell.tsx ('use client')
'use client';
import * as React from 'react';

export function ModalShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)}>Toggle</button>
      {open && <div className="modal">{children}</div>}
    </div>
  );
}

// Server Component: Page.tsx (default Server Component)
import { ModalShell } from './ModalShell';
import { HeavyServerDataList } from './HeavyServerDataList';

export default function Page() {
  return (
    <ModalShell>
      {/* HeavyServerDataList executes on the SERVER, zero client JS */}
      <HeavyServerDataList />
    </ModalShell>
  );
}
```

---

## 5. Streaming with React Suspense

Break up slow data fetching using Suspense boundaries so fast UI loads instantly:

```tsx
import { Suspense } from 'react';
import { ProfileHeader } from './ProfileHeader';
import { ProfileAnalyticsSkeleton } from './ProfileAnalyticsSkeleton';
import { AsyncProfileAnalytics } from './AsyncProfileAnalytics';

export default function DashboardProfile() {
  return (
    <div className="space-y-6">
      {/* Instant static or fast server UI */}
      <ProfileHeader />

      {/* Streamed independent widget with fallback skeleton */}
      <Suspense fallback={<ProfileAnalyticsSkeleton />}>
        <AsyncProfileAnalytics />
      </Suspense>
    </div>
  );
}
```

---

## 6. Server-Only Isolation

To prevent server modules containing database credentials or secret tokens from accidentally being imported into Client Components:

```bash
npm install server-only
```

```ts
// src/lib/auth/server-secret.ts
import 'server-only';

export const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY;
```

If a Client Component imports this file, the build will immediately fail with a compile error.

---

## 7. Mandatory Engineering Rules

1. **Default to Server Components**: Do not add `'use client'` at the top of a file unless the component strictly requires interactivity or browser APIs.
2. **Push Client Boundaries to the Leaves**: Keep Client Components as small leaf nodes in the tree rather than wrapping large page sections.
3. **No Dynamic Data Leakage**: Sensitive database IDs, token hashes, and internal metadata must never cross the serialization boundary into Client Component props.

