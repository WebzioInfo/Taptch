---
trigger: always_on
---

# Code Quality & Clean Engineering

## 1. Principles of High-Cohesion, Low-Coupling Engineering
- Consult `.agents/skills/software-engineering/SKILL.md` before authoring and reviewing code.
- Apply SOLID, DRY, KISS, and YAGNI pragmatically, never mechanically.
- High Cohesion: Group related functions and state together. A change in one domain requirement should touch only that module.
- Low Coupling: Depend on abstractions and minimal interfaces. Avoid God classes, monolithic service files, and deep inheritance hierarchies.

## 2. Brand Only From Config (Zero Brand Literals)
- Never hardcode "Tappzio" or any customer brand name in application components or UI templates.
- All user-facing brand names, assets, logos, and theme colors must derive dynamically from `src/config/brand.ts` or database `system_settings`.
- Enforced by automated architecture test `tests/architecture/brand-literal.test.ts`.

## 3. Readability & Maintainability
- Optimize for human readability. Use clear, intention-revealing names.
- Keep functions small, focused, and single-purpose.
- Prefer explicit type definitions over `any` or ambiguous objects.
- Implement comprehensive error handling with typed domain errors. Never silently swallow errors with empty `catch` blocks.

