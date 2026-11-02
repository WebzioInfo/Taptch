---
trigger: always_on
---

# Project Continuity & Session Resilience

## 1. Context Restoration Protocol
- At the start of every session or task:
  1. Read `AGENTS.md` and both foundational skills (`project-architecture`, `software-engineering`).
  2. Read `docs/PROGRESS.md` and `docs/DECISIONS.md`.
  3. Inspect actual repository git status and disk contents.
  4. Identify the first incomplete, unverified slice.
  5. Resume execution seamlessly from that exact checkpoint.

## 2. No Redundant Work
- Never redo or rewrite completed, verified milestones unless an architectural defect is discovered and documented.
- Never assume previous claims without verifying actual files and test commands.
- Leave the workspace in an operable, compiling, and recoverable state before concluding a turn.

