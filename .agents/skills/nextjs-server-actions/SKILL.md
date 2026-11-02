---
name: nextjs-server-actions
description: "Master Next.js 15 Server Actions, form handling with React 19 useActionState, optimistic updates, Zod validation, and CSRF protection."
risk: safe
source: Tappzio-core
date_added: "2026-11-02"
version: "1.0.0"
---

# Next.js 15 Server Actions & Mutations Skill

Comprehensive architectural standard for building type-safe, secure data mutations using Next.js 15 Server Actions, React 19 `useActionState`, and optimistic UI patterns.

---

## 1. When to Use This Skill

- Implementing form submissions and data mutations.
- Handling validation with Zod on the server.
- Managing pending states and action errors with React 19 `useActionState`.
- Implementing optimistic UI updates with React 19 `useOptimistic`.
- Deciding between Server Actions and API Route Handlers.

---

## 2. Server Actions vs Route Handlers Decision Framework

| Criterion | Server Actions (`'use server'`) | Route Handlers (`src/app/api/.../route.ts`) |
| :--- | :--- | :--- |
| **Primary Use Case** | Form submissions, direct UI mutations, progressive enhancement | Public REST APIs, mobile app endpoints, webhooks, file downloads |
| **Calling Mechanism** | Direct function call in JSX or form `action` | Standard HTTP `fetch()` request |
| **Authentication** | Automatic cookie forwarding from browser | Requires explicit header / session extraction |
| **Type Safety** | End-to-end typed function signature | Requires shared TypeScript envelope schemas |
| **Progressive Enhancement** | Works without JavaScript (HTML form action) | Requires JavaScript client execution |

**RULE**: Never duplicate business logic. Server Actions and Route Handlers must both call into domain services (e.g. `src/modules/profiles/index.ts`).

---

## 3. Standard Action Architecture

Every Server Action must return a consistent, typed ActionState:

```ts
// src/actions/types.ts
export interface ActionState<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}
```

```ts
// src/actions/profiles.ts
'use server';

import { z } from 'zod';
import { revalidateTag, revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createProfile } from '@/modules/profiles';
import type { ActionState } from './types';

const createProfileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric'),
  templateId: z.string().default('obsidian-luxury'),
});

export async function createProfileAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState<{ profileId: string; slug: string }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: 'Authentication required.' };
  }

  const rawData = {
    displayName: formData.get('displayName'),
    slug: formData.get('slug'),
    templateId: formData.get('templateId') || 'obsidian-luxury',
  };

  const validated = createProfileSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const actor = {
      userId: session.user.id,
      orgId: session.user.activeOrganizationId || null,
      role: session.user.role || 'user',
      isAdmin: session.user.role === 'super_admin',
    };

    const profile = await createProfile(actor, validated.data);

    revalidateTag('user-profiles');
    revalidatePath('/dashboard');

    return { success: true, data: { profileId: profile.id, slug: profile.slug } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create profile.',
    };
  }
}
```

---

## 4. Client Integration with React 19 `useActionState`

```tsx
'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { createProfileAction } from '@/actions/profiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CreateProfileForm() {
  const [state, formAction, isPending] = useActionState(createProfileAction, {
    success: false,
  });

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="text-destructive text-xs">{state.error}</div>
      )}

      <div>
        <label className="text-xs">Display Name</label>
        <Input name="displayName" required disabled={isPending} />
        {state.fieldErrors?.displayName && (
          <p className="text-destructive text-xs">{state.fieldErrors.displayName[0]}</p>
        )}
      </div>

      <div>
        <label className="text-xs">URL Slug</label>
        <Input name="slug" required disabled={isPending} />
        {state.fieldErrors?.slug && (
          <p className="text-destructive text-xs">{state.fieldErrors.slug[0]}</p>
        )}
      </div>

      <Button type="submit" variant="gold" disabled={isPending}>
        {isPending ? 'Creating Profile...' : 'Save Profile'}
      </Button>
    </form>
  );
}
```

---

## 5. Security & CSRF Considerations

Next.js Server Actions automatically verify the `Origin` header against the `Host` header to protect against Cross-Site Request Forgery (CSRF).

**Security Rules**:
1. **Never Trust User IDs from Form Input**: Always resolve the actor from the authenticated session cookies using Better Auth, never from hidden form inputs.
2. **Authorize Every Action**: Verify `can(actor, action, resource)` and check plan entitlements before executing mutations.
3. **Always Validate with Zod**: Parse incoming `FormData` or JSON inputs against a strict Zod schema before database insertion.

