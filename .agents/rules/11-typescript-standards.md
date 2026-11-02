# TypeScript Strict Mode Standards

## 1. Zero `any` Policy
- Strictly prohibit `any` across all production code and test suites.
- Use `unknown` for unvalidated external payloads and parse them with Zod schemas.
- Use `Record<string, unknown>` for dynamic dictionaries.
- Catch blocks must type errors as `unknown` and assert with `instanceof Error`.

## 2. Type Inference from Zod Schemas
- Never duplicate type declarations for forms or API payloads.
- Define a single source of truth using Zod (`export const schema = z.object({ ... })`).
- Infer the TypeScript interface via `export type MyType = z.infer<typeof schema>`.

## 3. Discriminated Unions & Exhaustive Checking
- Model multi-state domain entities with discriminated union types.
- Ensure exhaustive switch-case handling with TypeScript narrowing or `never` default checks.

## 4. Branded & Nominal Types
- Use branded types for distinct ID domains (`UserId`, `ProfileId`, `CardId`) to eliminate accidental parameter swapping bugs.

## 5. Defensive Domain Errors
- Always throw domain-specific subclasses of `Error` carrying structured metadata context (e.g. `EntitlementLimitExceededError`, `CardAlreadyClaimedError`, `ProfileNotFoundError`).

