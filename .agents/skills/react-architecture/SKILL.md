---
name: react-architecture
description: "Master React 19 architecture, component design, composition patterns, custom hooks, and unidirectional data flow."
risk: safe
source: tapzio-core
date_added: "2026-11-02"
version: "1.0.0"
---

# React 19 Component Architecture Skill

Engineering principles and design patterns for building scalable, maintainable React 19 applications using modern composition techniques and unidirectional data flow.

---

## 1. When to Use This Skill

- Designing component hierarchies in React 19.
- Choosing between container and presentational components.
- Designing custom hooks for reusable UI logic.
- Eliminating prop drilling through component composition.
- Refactoring complex components into cohesive, single-responsibility units.

---

## 2. Core Architectural Principles

### 1. Composition over Inheritance & Configuration
Instead of creating massive "God Components" with 30 configurable props, compose focused subcomponents:

```tsx
// Anti-Pattern: Prop Explosion
<Card
  title="Profile"
  showAvatar
  avatarUrl="/avatar.png"
  showSaveButton
  onSave={() => {}}
  footerText="Active"
/>

// Recommended: Compound Component Composition
<Card>
  <CardHeader>
    <Avatar src="/avatar.png" />
    <CardTitle>Profile</CardTitle>
  </CardHeader>
  <CardContent>{/* Profile details */}</CardContent>
  <CardFooter>
    <Button onClick={onSave}>Save</Button>
  </CardFooter>
</Card>
```

### 2. Unidirectional Data Flow
State flows down via props; events flow up via callbacks. Sibling components must never mutate each other directly; lift state to the nearest common ancestor or use a dedicated store (Zustand).

### 3. Container vs Presentational Separation
- **Presentational Components**: Pure functions of their props. Zero external I/O or network fetching. Easily testable and visually verifiable in isolation (e.g. `ProfileRenderer.tsx`).
- **Container / Orchestrator Components**: Connect to router, session, or API hooks. Retrieve data and pass it to presentational components (e.g. `PublicProfilePage.tsx`).

---

## 3. Custom Hook Engineering Standards

Custom hooks should encapsulate stateful logic without coupling to specific UI elements:

```ts
// src/hooks/use-clipboard.ts
import * as React from 'react';

export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = React.useState(false);

  const copy = React.useCallback(
    async (text: string) => {
      if (!navigator?.clipboard) return false;
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
        return true;
      } catch {
        setCopied(false);
        return false;
      }
    },
    [timeout]
  );

  return { copied, copy };
}
```

---

## 4. Mandatory Engineering Rules

1. **Keep Components Under 300 Lines**: When a component exceeds 300 lines of code, split it into smaller subcomponents (header, form, preview, footer).
2. **Explicit Props Interface**: Every React component must define an explicit TypeScript `interface` or `type` for its props. Never use `any`.
3. **No Hidden State Side Effects**: Avoid setting state during rendering. All state updates must be triggered by event handlers or explicit effects.

