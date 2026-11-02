---
name: testing-and-quality
description: Comprehensive test engineering using Vitest, Playwright, architecture assertion tests, and test fixture management. Activate when writing tests, fixing regressions, or verifying milestone acceptance criteria.
---

# Testing & Quality Assurance Skill

## 1. Testing Standards & Execution Mandate
- **Rule 5**: Never claim tests passed unless run. Always execute the test runner, capture real output, and inspect the exit code.
- **Rule 4**: No fake functionality. Mocks must be explicitly tagged `[MOCK]` and implement the production interface.
- **Rule 9**: Strict verification gate at each milestone. Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.

## 2. Test Architecture & Structure
```
tests/
├── architecture/         # AST-based rules enforcing code boundaries and brand config
│   ├── brand-literal.test.ts
│   └── no-direct-db-in-pages.test.ts
├── integration/          # Database RLS, pooled connection isolation, auth workflows
│   └── tenant-rls.test.ts
├── unit/                 # Pure domain functions, permissions, entitlements
│   ├── permissions.test.ts
│   └── entitlements.test.ts
└── e2e/                  # Playwright browser end-to-end user journeys
```

## 3. Database Testing with Vitest
- Vitest must be configured with `fileParallelism: false` in `vitest.config.ts` when testing persistent PGlite or SQLite instances to avoid concurrent directory file-lock contention.
- Test suites must seed their own isolated fixtures or run within rollbacked transactions to maintain idempotence.

