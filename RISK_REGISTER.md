# TAPTCH — Architecture Migration Risk Register

| Risk ID | Category | Description | Likelihood | Impact | Mitigation Strategy | Status |
|---|---|---|---|---|---|---|
| **RISK-01** | Database | Accidentally modifying or resetting Supabase tables during backend migration | Low | Critical | Strict freeze on migrations; reuse existing Drizzle schema definitions verbatim; `USE_PGLITE_DEV=true` for local tests; zero `DROP` or `ALTER` statements. | MITIGATED |
| **RISK-02** | Auth / Security | Session cookie mismatch across independent Vite frontend and NestJS backend | Medium | High | Configure NestJS CORS with `credentials: true`, specific origin whitelisting (`ALLOWED_ORIGINS`), and cookie attributes (`SameSite=Lax`, `Secure`, `HttpOnly`). | MITIGATED |
| **RISK-03** | Performance | Public profile `/p/:slug` latency regression in Single-Page Application (SPA) | Medium | High | Server-side Redis caching for pre-compiled profile snapshots; lightweight initial client bundle; caching headers (`stale-while-revalidate`). | MITIGATED |
| **RISK-04** | Dynamic QR | Sub-50ms redirect regression on `/dq/:token` | Low | High | Dedicated high-priority NestJS redirect controller with Redis cache-aside lookup before database querying; IP hashing executed asynchronously in background. | MITIGATED |
| **RISK-05** | Brand Governance | Hardcoded brand literals creeping into new React components | Low | Medium | Strict enforcement of `brandConfig` token imports; architecture assertion test `tests/architecture/brand-literal.test.ts` ported to CI. | MITIGATED |
| **RISK-06** | Package Manager | Competing lockfiles (`pnpm-lock.yaml`, `yarn.lock`) created during scaffolding | Low | Medium | Strict adherence to permanent rule: NPM exclusively (`package.json`, `package-lock.json`). | MITIGATED |
| **RISK-07** | Dependency Conflicts | React 19 peer-dependency conflicts with older UI libraries | Medium | Medium | Use compatible Vite plugins and React 19-ready component libraries already proven in the existing package.json. | MITIGATED |
| **RISK-08** | Rollback | Inability to revert to previous state if unexpected regression occurs | Low | High | Git branch isolation; monolithic code preserved until full verification; documented step-by-step rollback runbook. | MITIGATED |
