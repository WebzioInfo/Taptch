# Tapzio — Permanent Agent & Engineering Working Rules

@[Project Architecture Skill](.agents/skills/project-architecture/SKILL.md)
@[Software Engineering Skill](.agents/skills/software-engineering/SKILL.md)

## Mandatory Foundational Skills
Every conversation and task in this workspace MUST adhere to both foundational skills above.
- **Architecture First**: Consult `project-architecture` before altering folder structures or introducing modules.
- **Code Quality**: Apply `software-engineering` (SOLID, Clean Code, defensive error handling, testability) to every implementation and review.
- **Specialized Skills**: Discover and activate relevant domain skills in `.agents/skills/` (database, backend, frontend, security, testing, devops, performance, nfc-qr).

## Permanent Engineering Constraints
1. **Read Docs First**: Always read relevant files in `docs/` and `PROGRESS.md` before authoring code or architecture.
2. **Small Verified Slices**: Work in small, incremental, verified slices. Commit after each slice with a conventional commit message.
3. **Edit, Don't Regenerate**: Edit existing files surgically; never blindly overwrite full files unless explicitly requested.
4. **No Fake Functionality**: Zero stubbed UI buttons, zero mock handlers masquerading as real code, zero silently swallowed errors. Mocks must be explicitly tagged `[MOCK]` in code, logs, and docs.
5. **Never Claim Tests Passed Unless Run**: Execute the command, capture real CLI output, and inspect the exit code. Never simulate test results.
6. **Brand Only From Config**: Never hardcode "Tapzio" or customer brands in components; all copy, assets, and colors must derive from `src/config/brand.ts` or database `system_settings`. Enforce via test.
7. **Backend Enforces Security**: Never rely on frontend UI hiding for authorization; every endpoint and query must enforce `can()` permissions and tenant isolation.
8. **Separate Targets from Facts**: Never present an engineering goal (e.g. "<50ms redirect") as an achievement until empirically verified via test tools.
9. **One Milestone at a Time**: Execute one milestone at a time with a strict verification gate before advancing.
10. **Keep Living Docs Updated**: Update `docs/PROGRESS.md` and `docs/DECISIONS.md` on every architectural shift, dependency change, or slice completion.
11. **Payments Deferred (Phase 2)**: Zero payment gateway SDKs (no Razorpay/Stripe), no checkout, no payment webhooks. Plans and entitlements are data-driven, assigned manually by super admin. Card orders track physical status with manual `payment_status` (`unpaid | paid_offline | waived`).
12. **Drizzle ORM & PgBouncer Safety**: Use Drizzle ORM with `postgres.js` (`prepare: false`). In pooled transactions, always enforce tenant session variables via `SELECT set_config('app.current_user_id', $1, true)`.
13. **Zero Dynamic Profile Hot Path**: Public profile pages (`/p/[slug]`) must never import `cookies()`, `headers()`, or `connection()` that force dynamic server-side rendering.
14. **Worker Decoupling**: BullMQ workers run in a persistent worker container/process. Web routes only enqueue (`queue.add`).
15. **Windows & Cross-Platform Rules**: All scripts must run in PowerShell and cross-platform (via `cross-env`, `tsx`, Node). Maintain `.gitattributes` (`* text=auto eol=lf`) and forward-slash paths in code.
