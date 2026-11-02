---
name: frontend-development
description: Next.js App Router, React 19, Tailwind CSS, shadcn/ui (Radix), Obsidian Luxury design system, Zustand state management, dnd-kit builder, responsive mobile-first UI, and accessibility. Activate when developing UI components, pages, or client state.
---

# Frontend Development Skill

## 1. Design System & Visual Directions
- Flagship Onboarding Direction: **Obsidian Luxury (Direction 1)** (`--background: #0A0A0C`, `--primary: #D4AF37` Metallic Gold, `--card: #141418`).
- Secondary Directions: **Ivory** (warm editorial paper, terracotta accent) and **Aurora** (deep indigo, electric sky accent).
- All color combinations must strictly pass WCAG 2.2 AA / AAA contrast standards as computed in `docs/audit/CONTRAST_RATIOS.md`.
- Interactive Design System Studio available at `/dev/gallery` for verifying components across desktop (1280px) and mobile (390px) viewports.

## 2. Zero Dynamic Profile Hot Path Rule
- Public digital profile pages (`/p/[slug]`) must render statically or via Incremental Static Regeneration (ISR).
- **CRITICAL**: Never import `cookies()`, `headers()`, or `connection()` inside `/p/[slug]` hot paths, as this forces dynamic server-side rendering and degrades cacheability.

## 3. Brand Config Compliance
- Never hardcode "Tappzio" or any customer brand name in application components or templates.
- Import all brand assets, titles, and logos from `@/config/brand` or database `system_settings`.
- Enforced by automated architecture test `tests/architecture/brand-literal.test.ts`.

## 4. Advanced Profile Builder UX (dnd-kit + Zustand)
- Three-pane layout: Navigation / Section List, Canvas Preview, Section Properties Inspector.
- Drag-and-drop powered by `@dnd-kit/core` and `@dnd-kit/sortable`.
- Client-side state managed via Zustand store with full undo/redo history stack and autosave debouncing.

