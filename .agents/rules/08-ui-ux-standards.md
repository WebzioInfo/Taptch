---
trigger: always_on
---

# UI/UX & Design System Governance

## 1. Aesthetic Identity & Design System
- **Flagship Aesthetic**: **Obsidian Luxury**
  - Background: `#0A0A0C` (Deep Obsidian)
  - Card & Surface: `#121216` / `#18181D` (Matte Charcoal)
  - Primary / Accent: `#D4AF37` / `#E5C058` (Brushed Metallic Gold)
  - Border: `hsl(var(--border) / 0.6)` (Crisp, subtle dividers)
  - Secondary Themes: **Ivory Minimalist** (warm paper editorial) and **Aurora Creator** (vibrant glassmorphism).
- **Prohibited Aesthetics**:
  - No generic AI-generated templates (e.g. purple gradient on white card soup).
  - No random, uncalibrated border radii. Use system tokens (`rounded-lg`, `rounded-xl`, `rounded-2xl`).
  - No excessive, stacked shadows or heavy blurred backdrops that cause GPU paint jank.
  - No decorative elements that reduce text legibility or usability.

## 2. Interaction & State Integrity
- Every user-facing component must implement:
  1. **Loading State**: Subtle Skeleton loading or spinner, preventing layout shifts (CLS < 0.1).
  2. **Empty State**: Meaningful vector illustration or icon, helpful title, and clear action button.
  3. **Error State**: Non-blocking contextual alert with clear diagnostic message and retry action.
  4. **Active / Hover State**: Fast, hardware-accelerated transitions (150ms-200ms `cubic-bezier(0.16, 1, 0.3, 1)`).
- Never render fake buttons, placeholder `#` links, or mock submit handlers.

## 3. Responsive Mobile-First Architecture
- Public digital profiles (`/p/[slug]`) and onboarding journeys must be engineered mobile-first:
  - 360px–430px (iPhone & Android flagships)
  - 768px–1024px (Tablets / Foldables)
  - 1280px+ (Desktop workspaces & Admin cockpits)
- Zero horizontal overflow. Zero unclipped overflowing text. Zero touch targets smaller than 44x44px.

## 4. Brand Token Source of Truth
- Never hardcode "Taptch" or any customer brand name in UI components.
- Always import brand copy, logos, and links from `@/config/brand` or database `system_settings`.
- Enforced by automated architecture test `tests/architecture/brand-literal.test.ts`.

