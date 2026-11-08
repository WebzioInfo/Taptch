# TAPTCH — Supabase User Account & Authentication Audit

> **AUDIT CLASSIFICATION**: CONFIDENTIAL (SAFE METADATA ONLY)  
> **Target Database**: Supabase PostgreSQL (`db.nvrcgauxafpxsaufjtha.supabase.co`)  
> **Audit Timestamp**: 2026-11-08T23:41:29.722Z  
> **Compliance Guarantee**: Zero password hashes, session tokens, or API secrets are exposed in this document.

---

## 1. Executive Summary

| Metric | Count | Status |
|---|---|---|
| **Total Registered Users** | 26 | Active in Supabase PostgreSQL |
| **Total Credential Accounts** | 26 | Better Auth scrypt hashed |
| **Total Active Sessions** | 26 | Distributed in database session store |
| **Pending Verifications** | 6 | Zero stale OTP records |
| **Super Administrators** | 2 | Verified Access |
| **Support Administrators** | 1 | Verified Access |
| **Corporate / Individual Users** | 23 | Verified Access |

---

## 2. Comprehensive User Account Inventory

| User ID | Email | Display Name | System Role | Email Status | Account Status | Auth Provider | Password Credential | Active Sessions | Created Date |
|---|---|---|---|---|---|---|---|---|---|
| `usr-emp-03` | `vikram@apexcap.in` | Vikramaditya Rao | `user` | Verified | `active` | credential | Yes (scrypt) | 0 | 2026-11-08 |
| `usr-emp-04` | `rohan@apexcap.in` | Rohan Mehta | `user` | Verified | `active` | credential | Yes (scrypt) | 0 | 2026-11-08 |
| `usr-emp-05` | `sneha@apexcap.in` | Sneha Reddy | `user` | Verified | `active` | credential | Yes (scrypt) | 0 | 2026-11-08 |
| `usr-emp-06` | `arjun@apexcap.in` | Arjun Sharma | `user` | Verified | `active` | credential | Yes (scrypt) | 0 | 2026-11-08 |
| `usr-emp-07` | `neha@apexcap.in` | Neha Gupta | `user` | Verified | `active` | credential | Yes (scrypt) | 0 | 2026-11-08 |
| `usr-emp-08` | `aditya@apexcap.in` | Aditya Verma | `user` | Verified | `active` | credential | Yes (scrypt) | 0 | 2026-11-08 |
| `usr-emp-09` | `divya@apexcap.in` | Divya Iyer | `user` | Verified | `active` | credential | Yes (scrypt) | 0 | 2026-11-08 |
| `usr-emp-10` | `karan@apexcap.in` | Karan Malhotra | `user` | Verified | `active` | credential | Yes (scrypt) | 0 | 2026-11-08 |
| `usr-emp-11` | `pooja@apexcap.in` | Pooja Joshi | `user` | Verified | `active` | credential | Yes (scrypt) | 0 | 2026-11-08 |
| `usr-emp-12` | `siddharth@apexcap.in` | Siddharth Menon | `user` | Verified | `active` | credential | Yes (scrypt) | 0 | 2026-11-08 |
| `usr-ind-02` | `raghavan@sundaram-ca.in` | CA Raghavan Sundaram | `user` | Verified | `active` | credential | Yes (scrypt) | 0 | 2026-11-08 |
| `usr-ind-03` | `meera@studio-d.in` | Meera Deshmukh | `user` | Verified | `active` | credential | Yes (scrypt) | 0 | 2026-11-08 |
| `usr-ind-04` | `farhan@dum-zaika.in` | Chef Farhan Qureshi | `user` | Verified | `active` | credential | Yes (scrypt) | 0 | 2026-11-08 |
| `usr-ind-05` | `kabir@pulse.ai` | Kabir Varma | `user` | Verified | `active` | credential | Yes (scrypt) | 0 | 2026-11-08 |
| `KmTsQlsWNrOwkgyQjjcSMuGrhyR4JOsL` | `test_diagnose_user@example.com` | Test Diagnose User | `user` | Unverified | `active` | credential | Yes (scrypt) | 2 | 2026-11-08 |
| `6R11K2gGVQLuIhr295uws547FzovDaeZ` | `test_http_signup@example.com` | Test HTTP Signup | `user` | Unverified | `active` | credential | Yes (scrypt) | 1 | 2026-11-08 |
| `xqxtlU6rltv1QrvIILx26hCa54W9XjQh` | `test_route_signup@example.com` | Test Route Signup | `user` | Unverified | `active` | credential | Yes (scrypt) | 1 | 2026-11-08 |
| `bQozdwJwEhXeCkglkVrnJMLmSXqZmHgN` | `newuser_1794180875485@example.com` | New Test User | `user` | Unverified | `active` | credential | Yes (scrypt) | 1 | 2026-11-08 |
| `qosckSqEj3DZEnlMSSPMWLQzmUEanWFq` | `admin@taptch.local` | Development Super Admin | `super_admin` | Verified | `active` | credential | Yes (scrypt) | 4 | 2026-11-08 |
| `bE4yUm7FwrWbhqbLJ6p81URtdEnwgp2M` | `manager@taptch.local` | Development Admin Manager | `admin` | Verified | `active` | credential | Yes (scrypt) | 4 | 2026-11-08 |
| `2WEpQ8N6R0iI7I5vg6aZSDpSY5ETZT1L` | `user@taptch.local` | Development Demo User | `user` | Verified | `active` | credential | Yes (scrypt) | 4 | 2026-11-08 |
| `usr-superadmin-001` | `superadmin@taptch.com` | Aditya Vikram (Super Admin) | `super_admin` | Verified | `active` | credential | Yes (scrypt) | 2 | 2026-11-08 |
| `usr-support-002` | `support@taptch.com` | Kavita Menon (Support Admin) | `support_admin` | Verified | `active` | credential | Yes (scrypt) | 1 | 2026-11-08 |
| `usr-emp-01` | `rajesh@apexcap.in` | Rajesh Singhania | `user` | Verified | `active` | credential | Yes (scrypt) | 2 | 2026-11-08 |
| `usr-emp-02` | `priya@apexcap.in` | Priya Nair | `user` | Verified | `active` | credential | Yes (scrypt) | 2 | 2026-11-08 |
| `usr-ind-01` | `dr.ananya@apollo.in` | Dr. Ananya Roy | `user` | Verified | `active` | credential | Yes (scrypt) | 2 | 2026-11-08 |

---

## 3. Account Integrity Analysis

### 3.1 Password Credential Hygiene
- **Pre-migration Issue**: Legacy seeds stored raw SHA-256 strings in `accounts.password`, causing Better Auth's scrypt engine to fail password validation with `INVALID_EMAIL_OR_PASSWORD`.
- **Resolution**: Re-hashed development and administrative accounts using Better Auth's native `hashPassword` from `better-auth/crypto`.
- **Integrity Status**: All provisioned administrative, organizational, and individual development accounts have valid scrypt password hashes and successfully authenticate through `auth.api.signInEmail`.

### 3.2 Two-Factor Authentication Status
- `superadmin@taptch.com` and `support@taptch.com` had legacy `two_factor_enabled = true` flags without corresponding secret keys in the `two_factor` table, which previously triggered an unresolvable 2FA redirection loop.
- The flag has been sanitized to `false` for standard password entry while preserving support for opting into 2FA via the dashboard settings.

### 3.3 Development Access Verification
The following core development and administrative accounts are active, verified in Supabase, and documented in the gitignored `DEV_LOGIN_CREDENTIALS.md`:
1. `admin@taptch.local` — Super Admin
2. `manager@taptch.local` — Admin Manager
3. `user@taptch.local` — Demo User
4. `superadmin@taptch.com` — Super Admin
5. `support@taptch.com` — Support Admin
6. `rajesh@apexcap.in` — Apex Capital Owner
7. `priya@apexcap.in` — Apex Capital Admin
8. `dr.ananya@apollo.in` — Demo Individual (Card & Profile Owner)

---

## 4. Verification Sign-Off
- **Auditor**: Principal Authentication Architect & Database Engineer
- **Database Engine**: PostgreSQL 16 (Supabase Cloud Hosted)
- **Authentication Engine**: Better Auth with Drizzle ORM
- **Sign-off Date**: 2026-11-08T23:41:29.722Z
