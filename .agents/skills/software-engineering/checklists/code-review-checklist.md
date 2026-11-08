# Code Quality & Review Checklist

Before marking any code change complete, systematically verify:

- [ ] **Single Responsibility**: Does each function and module do exactly one cohesive thing?
- [ ] **Brand Isolation**: Are there any hardcoded "Taptch" brand strings in client components? (Must use `src/config/brand.ts`).
- [ ] **Error Handling**: Are all exceptions caught and handled with typed domain errors? Are there any empty `catch` blocks?
- [ ] **Security & Authorization**: Is there a server-side authorization check (`can()`) and tenant isolation via `withActor()`?
- [ ] **Sensitive Data**: Are secrets, tokens, passwords, or PII exposed in logs or network responses?
- [ ] **Database Integrity**: Does the query respect transaction-local RLS variables under PgBouncer?
- [ ] **Test Coverage**: Does the slice include automated tests, and did `pnpm test` pass with live execution?
- [ ] **Type Safety**: Did `pnpm typecheck` exit with 0 errors without `any` escapes?
- [ ] **Lint & Style**: Did `pnpm lint` exit with 0 errors and 0 warnings?

