# TAPTCH — Security Architecture & Vulnerability Audit

## 1. Security Philosophy & Zero-Trust Architecture
TAPTCH implements a defense-in-depth, zero-trust security architecture. Frontend visibility toggles are treated as non-authoritative presentation concerns. Every API route handler, server action, and background mutation strictly evaluates actor authentication, organization membership, and permission capabilities.

---

## 2. Threat Vector Evaluation & Mitigations

| Threat Vector | Evaluation & Mitigations | Status |
|---|---|---|
| **Insecure Direct Object References (IDOR)** | All resource lookups verify active session tenancy. User-supplied organization or profile IDs are validated via `can(actor, action, resource)`. Public order tracking requires 10-digit phone verification. | **RESOLVED** |
| **SQL Injection** | Parameterized queries enforced across all database queries via Drizzle ORM. Zero raw string interpolation. | **RESOLVED** |
| **Cross-Site Scripting (XSS)** | React 19 automatic output escaping. HTML rendering sanitized. Strict CSP headers in production responses. | **RESOLVED** |
| **Cross-Site Request Forgery (CSRF)** | SameSite cookie attributes configured on all session cookies. State-changing mutations require validated POST/PUT bodies. | **RESOLVED** |
| **Open Redirects & Token Tampering** | QR code and NFC redirect destinations are validated against strict whitelist patterns. Dynamic redirects use cryptographic HMAC-SHA256 signatures with 128-bit entropy. | **RESOLVED** |
| **Brute Force & Denial of Service** | Sliding-window rate limiters guard checkout, order tracking, and authentication endpoints. Expired rate limit entries are garbage collected automatically. | **RESOLVED** |
| **Privacy Compliance (DPDP Act)** | Visitor IP addresses are hashed using a 24-hour rotating cryptographic salt and discarded immediately. Raw IP addresses are never persisted. | **RESOLVED** |
| **Secret Redaction in Logging** | Passwords, OTP tokens, JWT secrets, and activation keys are automatically masked in Pino logger outputs. | **RESOLVED** |

---

## 3. Automated Security Verification
Automated test `tests/integration/adversarial-security.test.ts` executes 7 adversarial test cases against API endpoints to verify the rejection of expired tokens, invalid signatures, manipulated parameters, and unauthorized access.
