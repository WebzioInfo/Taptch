---
name: improve-ui
description: Audit an existing product surface against its own design evidence, identify verified UI problems, and write self-contained implementation plans for another agent. Strictly read-only on product source. Use when asked to review, refine, improve, or clean up an interface without replacing its identity; investigate design-system drift; or prepare a design handoff.
---

# Improve UI

Audit one coherent product surface against the design system that actually governs it. Preserve the product's identity, reuse existing owners, and prefer no finding to an unsupported one. Write plans only for changes the user selects; another agent executes them.

---

## Boundaries & Operational Discipline

- **Never modify product source directly during audit**: Create or edit files only under `design-plans/`.
- **No mutating operations**: Do not install dependencies, run formatters, commit, push, or mutate the working tree.
- **Self-contained plans**: Every generated plan must be self-contained; its executor has no conversation context.

---

## 1. Select the Surface & Trace the Path

Honor the scope:
1. Select one deployable application and one coherent surface family representing a primary product task.
2. Start from the surface's routes and layouts.
3. Trace the rendered path through compositions, shared components, variants, resolved tokens, and styles. A connection exists only when proven through imports, props, resolved configuration, or CSS inheritance.

---

## 2. Reconstruct the Local System

Check for design documentation (`docs/DESIGN_SYSTEM.md`, surface-local components):
- Inspect only the tokens, CSS variables, primitives, variants, and themes relevant to the traced path.
- Resolve aliases and variants to their true definitions.
- Record the design language: audited surface, design sources, documented decisions, and explicit exceptions.

---

## 3. Prove Findings (The Three Proof Gates)

A candidate becomes a finding only when all three proofs exist:
1. **Contract**: Cite a binding design decision for this property and scope, or a direct contradiction in user-facing presentation within the same task.
2. **Runtime**: Prove that the cited owner, value, or token reaches the affected surface through the traced runtime path.
3. **Correction**: State exactly one change required by the evidence. If it depends on an existing token, variant, primitive, or exemplar, name it explicitly. If the evidence cannot determine the correct choice, reject the candidate.

---

## 4. Vet & Falsify Findings

Before reporting, re-open every cited source and attempt to falsify each candidate:
- Delete if the problem does not match the actual code.
- Delete if the rule does not govern that surface.
- Delete if counterevidence shows the difference is intentional or valid.
- Delete if another finding describes the same root problem.

---

## 5. Report Format

Present surviving findings (maximum 3, ordered by leverage):

```markdown
## Design Language
- Audited surface:
- Design sources:
- Documented decisions:
- Explicit exceptions:

## Findings
| # | Problem | Evidence | Proposed Change | Scope | Confidence |
|---|---|---|---|---|---|

## Improve First
<Highest-leverage finding and rationale, or no supported recommendation.>
```

---

## 6. Specify Selected Changes

Write one plan per selected change into `design-plans/NNN-short-slug.md`.
- Never invent values when the repository provides a design token.
- Introduce new primitives only after proving why the existing design system cannot express the decision.
