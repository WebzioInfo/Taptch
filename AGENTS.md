# Tappzio — Permanent Agent & Engineering Working Rules

@[Project Architecture Skill](.agents/skills/project-architecture/SKILL.md)
@[Software Engineering Skill](.agents/skills/software-engineering/SKILL.md)

## Mandatory Foundational Skills & All-Skills Mandate
Every conversation and task in this workspace MUST adhere to both foundational skills above.
- **Architecture First**: Consult `project-architecture` before altering folder structures or introducing modules.
- **Code Quality**: Apply `software-engineering` (SOLID, Clean Code, defensive error handling, testability) to every implementation and review.
- **Mandatory All-Skills Review**: For every prompt and task, inspect, read, and consider the complete `.agents/skills/` library before acting.

## Permanent Engineering Constraints
1. **Read Docs First**: Always read relevant files in `docs/` and `PROGRESS.md` before authoring code or architecture.
2. **Small Verified Slices**: Work in small, incremental, verified slices. Commit after each slice with a conventional commit message.
3. **Edit, Don't Regenerate**: Edit existing files surgically; never blindly overwrite full files unless explicitly requested.
4. **No Fake Functionality**: Zero stubbed UI buttons, zero mock handlers masquerading as real code, zero silently swallowed errors. Mocks must be explicitly tagged `[MOCK]` in code, logs, and docs.
5. **Never Claim Tests Passed Unless Run**: Execute the command, capture real CLI output, and inspect the exit code. Never simulate test results.
6. **Brand Only From Config**: Never hardcode "Tappzio" or customer brands in components; all copy, assets, and colors must derive from `src/config/brand.ts` or database `system_settings`. Enforce via test.
7. **Backend Enforces Security**: Never rely on frontend UI hiding for authorization; every endpoint and query must enforce `can()` permissions and tenant isolation.
8. **Separate Targets from Facts**: Never present an engineering goal (e.g. "<50ms redirect") as an achievement until empirically verified via test tools.
9. **One Milestone at a Time**: Execute one milestone at a time with a strict verification gate before advancing.
10. **Keep Living Docs Updated**: Update `docs/PROGRESS.md` and `docs/DECISIONS.md` on every architectural shift, dependency change, or slice completion.
11. **Payments Deferred (Phase 2)**: Zero payment gateway SDKs (no Razorpay/Stripe), no checkout, no payment webhooks. Plans and entitlements are data-driven, assigned manually by super admin. Card orders track physical status with manual `payment_status` (`unpaid | paid_offline | waived`).
12. **Drizzle ORM & PgBouncer Safety**: Use Drizzle ORM with `postgres.js` (`prepare: false`). In pooled transactions, always enforce tenant session variables via `SELECT set_config('app.current_user_id', $1, true)`.
13. **Zero Dynamic Profile Hot Path**: Public profile pages (`/p/[slug]`) must never import `cookies()`, `headers()`, or `connection()` that force dynamic server-side rendering.
14. **Worker Decoupling**: BullMQ workers run in a persistent worker container/process. Web routes only enqueue (`queue.add`).
15. **Windows & Cross-Platform Rules**: All scripts must run in PowerShell and cross-platform (via `cross-env`, `tsx`, Node). Maintain `.gitattributes` (`* text=auto eol=lf`) and forward-slash paths in code.
16. **Mandatory Package Manager**: This project uses NPM exclusively. Always use npm commands. Never use pnpm, yarn, or bun. Before running package commands, inspect the existing `package.json` and `package-lock.json`.
17. **MANDATORY ALL-SKILLS POLICY**: For every new user prompt and every task in this repository, inspect and read every available skill in `.agents/skills/` before starting work. Consider the instructions from the complete skill library. Apply all relevant engineering requirements. Never silently skip a skill. Re-read skills for every new task rather than assuming previous context remains valid. If a skill cannot be accessed, report it and do not falsely claim compliance.
18. **Next.js 15 & React 19 Standards**: Default to Server Components, resolve async route parameters (`await params`), maintain Zero Dynamic Hot Path on public profiles (`/p/[slug]`), and validate all mutations with Zod.
19. **Authoritative 44-Skills Catalog**: All 44 skills under `.agents/skills/` are authoritative. Consult specialist skills across Next.js, React, TypeScript, and Tappzio domain engines (`digital-profile-engine`, `template-rendering-engine`, `subscription-entitlements`, `public-profile-seo`) before implementing features.

