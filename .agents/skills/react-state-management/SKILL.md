---
name: react-state-management
description: "Master React state management using Zustand, React Context, and URL search parameters without unnecessary re-renders."
risk: safe
source: Tappzio-core
date_added: "2026-11-02"
version: "1.0.0"
---

# React State Management Architecture Skill

Comprehensive guide for managing UI and application state in React 19 using Zustand, URL search parameters, and React Context.

---

## 1. When to Use This Skill

- Managing complex interactive state (e.g. the 3-pane profile builder).
- Choosing between local state (`useState`), global client store (Zustand), URL state, and Server State.
- Preventing full-tree re-renders caused by oversized React Context providers.
- Synchronizing search, pagination, and filter state with browser URL parameters.

---

## 2. State Classification Matrix

| State Type | Characteristics | Recommended Solution |
| :--- | :--- | :--- |
| **Server State** | Data originating from database/cache; shared across users | Server Components / TanStack Query |
| **URL State** | Filters, active tab, page number, search keywords | `next/navigation` (`useSearchParams`, `useRouter`) |
| **Local UI State** | Dropdown open/close, hover state, modal visibility | React `useState` / `useReducer` |
| **Complex App State** | Multi-step wizard, interactive builder, dragged items | **Zustand** store (`src/stores/`) |

---

## 3. Zustand Store Design Patterns

Zustand provides a lightweight, hook-based store that only triggers re-renders on components subscribed to specific state slices:

```ts
// src/stores/builder-store.ts
import { create } from 'zustand';

interface Section {
  id: string;
  sectionType: string;
  isEnabled: boolean;
  displayOrder: number;
}

interface BuilderState {
  profileId: string | null;
  activeTemplateId: string;
  sections: Section[];
  isDirty: boolean;
  setProfileId: (id: string) => void;
  setTemplateId: (templateId: string) => void;
  toggleSection: (sectionId: string) => void;
  reorderSections: (newOrder: Section[]) => void;
  reset: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  profileId: null,
  activeTemplateId: 'obsidian-luxury',
  sections: [],
  isDirty: false,

  setProfileId: (id) => set({ profileId: id }),
  setTemplateId: (templateId) => set({ activeTemplateId: templateId, isDirty: true }),
  toggleSection: (sectionId) =>
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId ? { ...s, isEnabled: !s.isEnabled } : s
      ),
      isDirty: true,
    })),
  reorderSections: (newOrder) => set({ sections: newOrder, isDirty: true }),
  reset: () => set({ isDirty: false }),
}));
```

### Subscribing to Slices (Zero Unnecessary Re-renders)

```tsx
// Only re-renders when activeTemplateId changes, NOT when sections reorder
export function TemplateSwatchPreview() {
  const activeTemplateId = useBuilderStore((state) => state.activeTemplateId);
  return <div>Active Theme: {activeTemplateId}</div>;
}
```

---

## 4. URL Parameters as State

For shareable filters, tabs, and pagination, synchronize state with URL search parameters:

```tsx
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function CategoryFilter({ currentCategory }: { currentCategory: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleSelect = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <button onClick={() => handleSelect('business')}>Business</button>
  );
}
```

---

## 5. Mandatory Engineering Rules

1. **Avoid Giant Context Providers**: Never put high-frequency state updates inside React Context without splitting the state and dispatch contexts, as it re-renders every consumer component.
2. **Use Selectors with Zustand**: Always pass a selector function (e.g. `useStore(s => s.item)`) to prevent components from re-rendering when unrelated store properties change.
3. **Keep Ephemeral State Local**: Form input typing, modal popups, and dropdown open states belong in local `useState`, not global stores.

