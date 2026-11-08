---
name: typescript-strict-mode
description: "Master TypeScript 5 strict engineering, branded types, discriminated unions, Zod schema type inference, and zero-any policy."
risk: safe
source: Taptch-core
date_added: "2026-11-02"
version: "1.0.0"
---

# TypeScript Strict Mode & Type Architecture Skill

Engineering standard for authoring resilient, type-safe TypeScript code in enterprise Next.js applications with zero `any` usage.

---

## 1. When to Use This Skill

- Authoring types, interfaces, and function signatures.
- Designing domain error hierarchies with structured context.
- Inferring TypeScript types directly from Zod validation schemas (`z.infer<typeof schema>`).
- Implementing branded types for ID isolation (e.g. `UserId` vs `ProfileId`).
- Using discriminated unions for exhaustive state machines.

---

## 2. Zero `any` Policy & Alternatives

Using `any` disables TypeScript's safety guarantees entirely. Replace `any` with precise types:

| Ambiguous Scenario | Anti-Pattern (`any`) | Preferred Strict Type |
| :--- | :--- | :--- |
| Unknown JSON payload | `const data: any` | `const data: unknown` + Zod parser |
| Dynamic key-value dictionary | `const meta: any` | `Record<string, unknown>` |
| Error handling in catch block | `catch (err: any)` | `catch (err: unknown)` + `instanceof Error` |
| Generic React component props | `Component: React.ComponentType<any>` | `Component: React.ComponentType<TProps>` |

---

## 3. Discriminated Unions for Exhaustive Pattern Matching

Use a literal discriminant property (e.g. `status` or `type`) to allow TypeScript to narrow types automatically:

```ts
export type RedirectTarget =
  | { status: 'active'; slug: string; profileId: string; cardId: string }
  | { status: 'unclaimed'; redirectToken: string; cardId: string }
  | { status: 'lost' | 'deactivated'; cardId: string }
  | { status: 'not_found' };

export function handleRedirect(target: RedirectTarget): string {
  switch (target.status) {
    case 'active':
      // TypeScript guarantees slug exists here!
      return `/p/${target.slug}?ref=nfc`;
    case 'unclaimed':
      // TypeScript guarantees redirectToken exists here!
      return `/claim/${target.redirectToken}`;
    case 'lost':
    case 'deactivated':
      return '/?error=card_disabled';
    case 'not_found':
      return '/?error=card_not_found';
  }
}
```

---

## 4. Zod Schema Type Inference

Derive TypeScript types directly from runtime validation schemas to eliminate type duplication:

```ts
import { z } from 'zod';

export const createProfileInputSchema = z.object({
  displayName: z.string().min(2).max(128),
  slug: z.string().min(2).max(64),
  profileType: z.enum(['personal', 'business']).default('personal'),
  templateId: z.string().default('obsidian-luxury'),
  headline: z.string().max(255).optional(),
});

// Single source of truth for TypeScript interface
export type CreateProfileInput = z.infer<typeof createProfileInputSchema>;
```

---

## 5. Branded / Nominal Types

Prevent accidental assignment of incompatible strings (e.g. passing a `cardId` where a `profileId` is expected):

```ts
declare const __brand: unique symbol;
export type Brand<T, B> = T & { [__brand]: B };

export type UserId = Brand<string, 'UserId'>;
export type ProfileId = Brand<string, 'ProfileId'>;
export type CardId = Brand<string, 'CardId'>;

export function linkCard(userId: UserId, cardId: CardId, profileId: ProfileId) {
  // Compiler prevents passing cardId into profileId parameter!
}
```

---

## 6. Mandatory Engineering Rules

1. **Strict Compiler Flags**: Maintain `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true` in `tsconfig.json`.
2. **Defensive Error Types**: Always throw custom subclasses of `Error` with descriptive names (e.g. `ProfileNotFoundError`, `EntitlementLimitExceededError`).
3. **No Unchecked Casts**: Avoid `as any` or `as SomeType` type assertions unless preceded by a type guard or runtime assertion.

