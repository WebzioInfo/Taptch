---
trigger: always_on
---

# Architecture Governance

## 1. Architecture-First Mandate
- Analyze business domain, module boundaries, data ownership, and dependency direction before creating folders or authoring code.
- Consult `.agents/skills/project-architecture/SKILL.md` on every architectural decision.
- Every directory must represent a clear architectural responsibility or domain boundary. Never organize large systems solely by file type (e.g. avoid dumping-ground folders like `utils`, `helpers`, `misc`, `common2`).

## 2. Inward Dependency Flow & Layer Separation
- Strict separation of layers:
  `Presentation (UI/Routes)` → `Application (Use Cases/Services)` → `Domain (Entities/Rules)` → `Infrastructure (Adapters/Persistence/Integrations)`
- Business rules must never depend on frameworks, UI components, or direct database clients.
- Route handlers and Next.js page components must remain thin orchestration layers. They must never directly import raw database clients or embed multi-step business transactions.

## 3. Modular Monolith & Module Boundaries
- Domain modules reside under `src/modules/<domain>/`.
- Each domain module must expose a well-defined public interface (`index.ts`).
- Avoid direct cross-module table mutations or circular dependencies. Inter-module communication must use domain service interfaces or event dispatching.
- Log every architectural shift and technology selection as an Architectural Decision Record in `docs/DECISIONS.md`.

