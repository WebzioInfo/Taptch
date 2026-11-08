# TAPTCH — Security Architecture & Dependency Security Audit

**Audit Date:** November 9, 2026  
**Auditor:** Senior Security Architect, Principal QA & Full-Stack Engineer  
**Audit Scope:** Dependency vulnerability scanning, AST static analysis, runtime security headers, Row-Level Security (RLS) multi-tenant verification, and adversarial endpoint testing.

---

## 1. Automated Dependency Security Audit (`npm audit`)

An exhaustive audit of the 629 packages in the project tree was executed using official NPM registry security advisories.

### CLI Execution Output
```bash
$ npm audit
found 0 vulnerabilities
```
- **Total Packages Scanned:** 629
- **Known Vulnerabilities:** **0**
- **Critical:** 0
- **High:** 0
- **Moderate:** 0
- **Low:** 0
- **Exit Code:** 0

### Strategic Transitive Overrides
To proactively patch common vulnerabilities in transitive build tooling dependencies, the following overrides are explicitly enforced in `package.json`:
- **`esbuild: "^0.25.12"`**: Prevents older esbuild development server vulnerabilities.
- **`minimatch: "^11.0.4"`**: Guarantees ReDoS-free regular expression evaluation in globbing utilities.
- **`postcss: "$postcss"`**: Ensures all PostCSS consumers utilize vetted PostCSS `8.5.32`.
- **`@swc/helpers: "^0.5.17"`**: Aligns SWC compiler helpers across transpilation targets.

---

## 2. Threat Vector Evaluation & Mitigations

| Threat Vector | Evaluation & Mitigations | Status |
|---|---|---|
| **Dependency Vulnerabilities** | Automated CI audit via `npm audit`. Zero known CVEs in the dependency graph. Overrides enforce security on transitive tools. | ✅ **RESOLVED** |
| **Insecure Direct Object References (IDOR)** | All resource lookups verify active session tenancy. User-supplied organization or profile IDs are validated via `can(actor, action, resource)`. Public order tracking requires 10-digit phone verification. | ✅ **RESOLVED** |
| **SQL Injection** | Parameterized queries enforced across all database queries via Drizzle ORM. Zero raw string interpolation. | ✅ **RESOLVED** |
| **Cross-Site Scripting (XSS)** | React 19 automatic output escaping. HTML rendering sanitized. Strict CSP headers in production responses. | ✅ **RESOLVED** |
| **Cross-Site Request Forgery (CSRF)** | SameSite cookie attributes configured on all session cookies. State-changing mutations require validated POST/PUT bodies. | ✅ **RESOLVED** |
| **Open Redirects & Token Tampering** | QR code and NFC redirect destinations are validated against strict whitelist patterns. Dynamic redirects use cryptographic HMAC-SHA256 signatures with 128-bit entropy. | ✅ **RESOLVED** |
| **Brute Force & Denial of Service** | Sliding-window rate limiters guard checkout, order tracking, and authentication endpoints. Expired rate limit entries are garbage collected automatically. | ✅ **RESOLVED** |
| **Privacy Compliance (DPDP Act)** | Visitor IP addresses are hashed using a 24-hour rotating cryptographic salt and discarded immediately. Raw IP addresses are never persisted. | ✅ **RESOLVED** |
| **Secret Redaction in Logging** | Passwords, OTP tokens, JWT secrets, and activation keys are automatically masked in Pino logger outputs. | ✅ **RESOLVED** |

---

## 3. Row-Level Security (RLS) & Multi-Tenant Isolation

Multi-tenant data isolation is enforced at the database persistence layer using PostgreSQL Row-Level Security (`FORCE ROW LEVEL SECURITY`).

1. **Transaction-Scoped Session Variables:**
   ```sql
   SELECT set_config('app.current_user_id', $1, true);
   ```
   The `is_local = true` parameter strictly ensures that session tenancy is bound to the single transaction and automatically cleared when the connection is returned to the PgBouncer pool.
2. **Deterministic Multi-Tenant Tests:**
   The test suite includes `tests/integration/tenant-rls.test.ts` (5 tests) which rigorously validates that Tenant A can never query, update, or delete profiles, cards, or leads belonging to Tenant B.

---

## 4. Adversarial Endpoint Testing

Automated test suite [`tests/integration/adversarial-security.test.ts`](file:///d:/Webzio/taptch/tests/integration/adversarial-security.test.ts) executes 7 automated adversarial attack scenarios:
1. Rejection of expired tokens.
2. Rejection of forged HMAC signatures.
3. Rejection of manipulated user ID parameter injections.
4. Protection against unauthorized administrative action attempts.
5. Rejection of unauthenticated profile updates.
6. Verification of rate limiting on sensitive authentication routes.
7. Verification of IP anonymization hashing.

All 7 scenarios passed with 100% compliance.
