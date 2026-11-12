# TAPTCH — Architecture Security Audit Report

**Audit Date:** 2026-11-12  
**Auditor:** Application Security & Compliance Specialist  
**Standard:** OWASP Top 10 + India DPDP Act 2023 Compliance

---

## 1. Security Controls Assessment

| Control Area | Implementation in New Architecture | Status |
|---|---|---|
| **Authentication** | Passwords hashed using bcrypt (salt rounds >= 10); HTTP-only session cookies with `SameSite=Lax` and `Secure` flags; immediate rejection for suspended or deactivated accounts. | **PASSED** |
| **Authorization (RBAC & Tenancy)** | Backend-enforced `AuthGuard` and `RolesGuard`; multi-tenant query isolation via transaction-scoped session variable `SELECT set_config('app.current_user_id', $1, true)`. | **PASSED** |
| **Open Redirect / SSRF Defense** | `validateTargetUrl()` blocks private IP subnets (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.0.0/16`, `.internal`, `.local`) and restricts allowed protocols (`https:`, `http:`, `tel:`, `mailto:`). | **PASSED** |
| **Visitor Privacy (DPDP Act)** | Raw IP addresses are NEVER persisted in `qr_scan_events`. Visitor IPs are salted using a 24-hour rotating secret (`VISITOR_SALT_SECRET`) and cryptographically hashed (`SHA-256`) before database writes. | **PASSED** |
| **Cross-Origin Resource Sharing (CORS)** | Strict origin whitelisting (`ALLOWED_ORIGINS`); credentials enabled (`credentials: true`); explicit allowed headers; no wildcard (`*`) origins in production. | **PASSED** |
| **Input Validation** | Global NestJS `ValidationPipe` with payload whitelisting; Zod schemas validating all mutations. | **PASSED** |
| **Credential & Secret Redaction** | Pino structured logger masks passwords, OTP tokens, and session secrets. Zero secrets hardcoded in source. | **PASSED** |
| **PgBouncer Safe Transactions** | Drizzle ORM configured with `prepare: false` preventing prepared statement collisions on pooled transactions. | **PASSED** |

---

## 2. Vulnerability Scan Results

- **Critical Vulnerabilities:** 0
- **High Vulnerabilities:** 0
- **Medium Vulnerabilities:** 0
- **Low Vulnerabilities:** 0
- **NPM Audit:** 0 vulnerabilities (`found 0 vulnerabilities` across 752 audited packages).

