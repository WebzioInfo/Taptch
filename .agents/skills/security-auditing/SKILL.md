---
name: security-auditing
description: OWASP Top 10 prevention, multi-tenant IDOR protection, Better Auth 2FA, session revocation, rate-limiting defenses, secret redaction, and DPDP privacy compliance. Activate when reviewing security-critical paths or conducting audits.
---

# Security Auditing Skill

## 1. Multi-Tenant Authorization & IDOR Defense
- Insecure Direct Object References (IDOR) are the #1 vulnerability in multi-tenant SaaS.
- Every read, update, or delete request targeting an entity (`profile_id`, `card_id`, `organization_id`) must verify:
  1. Actor's authenticated identity.
  2. Actor's membership in the target organization.
  3. Action permission via `can(actor, action, resource)`.
  4. PostgreSQL Row-Level Security verification via `withActor()`.

## 2. Privacy & Indian DPDP Act Compliance
- **Raw IP Ban**: Never store raw visitor IP addresses in the database.
- Hasher implementation: Combine visitor IP with a daily rotating salt before storing in analytics tables:
  `visitor_hash = sha256(ip + daily_salt).slice(0, 32)`
- Support customer data export and account deletion pipelines.

## 3. Cryptographic Card Activation & Brute-Force Defense
- Physical NFC cards are distributed with a printed 6-character activation secret code.
- Activation codes are stored as irreversible cryptographic hashes (`activation_code_hash = sha256(code + salt)`).
- Card verification must execute in constant time (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.
- Enforce strict sliding-window rate limiting on `/claim/[token]`: 5 failed attempts per card token triggers a 1-hour lockout.

## 4. File Upload Sanitization
- Never trust client-supplied `Content-Type` headers or file extensions.
- Validate file magic bytes on upload.
- Process all uploaded avatar and profile images through `sharp` to strip EXIF metadata and re-encode to WebP/PNG before storing in Cloudflare R2 / MinIO.

