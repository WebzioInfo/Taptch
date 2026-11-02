---
trigger: always_on
---

# Testing & Quality Assurance Standards

## 1. Test Verification Mandate
- Execute test commands directly, capture real CLI outputs, and inspect the exit code.
- Never simulate or fabricate test results.
- Never weaken, bypass, or comment out failing assertions to artificially achieve a green test run. Fix the underlying implementation defect.

## 2. Testing Pyramid & Test Types
- **Unit Tests (`tests/unit/`)**: Pure domain rules, authorization logic (`can()`), entitlement engine (`assertWithinLimit`), and pure helper utilities. Fast, zero I/O where possible.
- **Integration Tests (`tests/integration/`)**: Database RLS isolation, session variable clearing across pooled transactions, Better Auth flows, and repository queries.
- **Architecture Tests (`tests/architecture/`)**: Structural rules enforcing zero raw DB access in route pages and zero hardcoded brand literals.
- **E2E & Load Tests (`tests/e2e/`, `load/`)**: Playwright user journeys and k6 concurrency simulations.

## 3. Test Reliability & Local Determinism
- Use `fileParallelism: false` in Vitest for database-backed tests to prevent SQLite/PGlite directory-lock collisions.
- Seed data and test fixtures must be deterministic, isolated, and idempotent.

