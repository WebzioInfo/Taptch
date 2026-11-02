---
trigger: always_on
---

# Documentation & Specification Standards

## 1. Documentation Integrity & Living Docs
- Maintain synchronized, accurate documentation in `docs/`.
- Never delete or blindly overwrite existing specification files in `docs/spec/`.
- Update `docs/PROGRESS.md` immediately upon verifying any milestone or slice.
- Record every significant architectural decision, package version pinning, and scope adjustment in `docs/DECISIONS.md`.

## 2. Objective Factual Reporting
- Clearly separate **Observed Facts** (verified via CLI or browser inspection), **Inferences** (engineering deductions), and **Targets/Goals** (desired future SLAs).
- When benchmarking or referencing third-party packages, verify against official documentation and record version numbers, source URLs, and observation timestamps.

