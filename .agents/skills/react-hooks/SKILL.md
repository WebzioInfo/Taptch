---
name: react-hooks
description: "Master React 19 hooks (use, useActionState, useOptimistic) and foundational hooks (useEffect, useCallback, useMemo) without stale closures."
risk: safe
source: Taptch-core
date_added: "2026-11-02"
version: "1.0.0"
---

# React 19 Hooks Mastery Skill

Comprehensive engineering guide for modern React 19 hooks, avoiding stale closures, dependency array traps, and unnecessary re-renders.

---

## 1. When to Use This Skill

- Using React 19 hooks: `use()`, `useActionState()`, `useOptimistic()`.
- Optimizing performance with `useCallback()` and `useMemo()`.
- Handling side effects cleanly with `useEffect()`.
- Resolving React lint warnings (`react-hooks/exhaustive-deps`).
- Preventing memory leaks and stale closures.

---

## 2. React 19 New Hooks

### The `use()` Hook

The `use()` hook unwraps promises or contexts directly inside components and can be called conditionally (unlike standard hooks):

```tsx
'use client';
import { use } from 'react';

export function ProfileComments({ commentsPromise }: { commentsPromise: Promise<string[]> }) {
  // Unwraps promise, suspends parent boundary until resolved
  const comments = use(commentsPromise);

  return (
    <ul>
      {comments.map((c, i) => (
        <li key={i}>{c}</li>
      ))}
    </ul>
  );
}
```

### `useActionState()`

Replaces legacy `useFormState` for managing async Server Action state:

```tsx
const [state, formAction, isPending] = useActionState(submitProfileForm, initialState);
```

### `useOptimistic()`

Displays updated state immediately while waiting for server mutation to resolve:

```tsx
const [optimisticProfile, setOptimisticProfile] = useOptimistic(
  profile,
  (current, update: Partial<typeof profile>) => ({ ...current, ...update })
);
```

---

## 3. Avoiding Stale Closures in `useEffect` and `useCallback`

### Stale Closure Trap
When a callback or effect references a state variable without listing it in the dependency array, it captures the initial value:

```tsx
// Anti-Pattern: Stale count
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1); // Stale 'count' captured!
  }, 1000);
  return () => clearInterval(timer);
}, []); // Missing count dependency

// Fix 1: Functional State Update (Preferred)
useEffect(() => {
  const timer = setInterval(() => {
    setCount((prev) => prev + 1); // Always current
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

---

## 4. When to Use `useMemo` & `useCallback`

Do not apply `useMemo` and `useCallback` blindly to every function or primitive calculation.

**Use `useCallback` when**:
1. Passing a callback to an optimized child component wrapped in `React.memo()`.
2. The callback is listed in the dependency array of a `useEffect` hook.

**Use `useMemo` when**:
1. Performing computationally expensive calculations (filtering/sorting 1,000+ items).
2. Passing an object/array as a prop to a memoized child component to maintain reference equality.

---

## 5. Mandatory Engineering Rules

1. **Never Suppress `exhaustive-deps`**: Never write `// eslint-disable-next-line react-hooks/exhaustive-deps` to silence linter warnings. Fix the dependencies or use functional state updates.
2. **Always Return Cleanup Functions**: Any `useEffect` that establishes an event listener, timer, or subscription MUST return a cleanup function to prevent memory leaks.
3. **Do Not Fetch in `useEffect` on Mount**: Prefer Server Components for data fetching. For client-side fetching, use `@tanstack/react-query` or SWR.

