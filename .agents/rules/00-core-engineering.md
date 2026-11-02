---
trigger: always_on
---

# Core Engineering Governance

## 1. Absolute Integrity & Zero Fabrication
- Never claim a task, slice, or test passed without executing the command and inspecting the real CLI output.
- Never present engineering goals or performance SLAs (e.g. "<50ms redirect", "<1.1s LCP") as achievements until empirically verified with benchmark tools.
- Never create fake functionality, mock buttons masquerading as working handlers, or silently swallowed errors. Any mock must implement the production interface and be explicitly tagged `[MOCK]` in code, logs, and docs.

## 2. Respect Approved Technical Scope
- Adhere strictly to the approved technology stack: Next.js 15 App Router, TypeScript strict, Drizzle ORM (`prepare: false`), PostgreSQL 16, PgBouncer, Redis, BullMQ in decoupled worker container, Better Auth, Tailwind CSS.
- Deferral of Payments: Zero payment gateway SDKs (no Razorpay, Stripe, Cashfree), no checkout flows, no payment webhooks in this release. Plans and entitlements are 100% data-driven and manually assigned by Super Admin. Physical card orders are modeled as order requests with a manual `payment_status`.

## 3. Surgical & Verified Development
- Work in small, incremental, verified slices.
- Edit existing files surgically; never blindly overwrite full files unless explicitly requested.
- Preserve existing comments, docstrings, and architectural rationale.
- Maintain documentation integrity and synchronize living docs (`PROGRESS.md`, `DECISIONS.md`) on every architectural shift or milestone completion.

## 4. Environment & Platform Rules
- All scripts and commands must run reliably in PowerShell on Windows 11 and cross-platform in Linux CI (via `cross-env`, `tsx`, Node).
- Maintain `.gitattributes` (`* text=auto eol=lf`) and forward-slash paths in all application code.

## 5. Mandatory Package Manager (NPM Exclusively)
- This project uses NPM exclusively for package management. Always use npm commands (`npm install`, `npm run <script>`, `npm test`). Never use pnpm, yarn, or bun.
- Maintain `package-lock.json` as the sole authoritative lockfile. Do not commit, generate, or mix competing lockfiles (`pnpm-lock.yaml`, `yarn.lock`).

## 6. Mandatory All-Skills Policy
- For every new user prompt and every task in this repository, inspect and read every available skill in `.agents/skills/` before starting work.
- Consider the instructions from the complete skill library. Apply all relevant engineering requirements.
- Never silently skip a skill. Re-read skills for every new task rather than assuming previous context remains valid.
- If a skill cannot be accessed, report it and do not falsely claim compliance.
