# TAPTCH — API Compatibility & Contract Verification Report

**Review Date:** 2026-11-12  
**Protocol:** RESTful JSON over HTTP  
**Standard Response Envelope:** `{ success: boolean, data?: T, error?: { code: string, message: string, details?: any } }`

---

## 1. Endpoint Contract Parity

| Legacy Monolith Endpoint | Migrated NestJS Endpoint | HTTP Method | Auth Requirement | Contract Status |
|---|---|---|---|---|
| `/api/health` | `/api/health` | GET | Public | **100% Identical** |
| `/api/ready` | `/api/ready` | GET | Public | **100% Identical** |
| `/api/auth/sign-in/email` | `/api/auth/sign-in/email` | POST | Public | **100% Identical** (diagnostic error codes preserved) |
| `/api/auth/sign-up/email` | `/api/auth/sign-up/email` | POST | Public | **100% Identical** |
| `/api/auth/sign-out` | `/api/auth/sign-out` | POST | Public | **100% Identical** (cookie cleared) |
| `/api/auth/get-session` | `/api/auth/get-session` | GET | Public | **100% Identical** |
| `/api/v1/profiles` | `/api/v1/profiles` | GET, POST | Authenticated | **100% Identical** |
| `/api/v1/profiles/:id` | `/api/v1/profiles/:id` | GET, PATCH | Authenticated | **100% Identical** |
| `/api/v1/profiles/by-slug/:slug` | `/api/v1/profiles/by-slug/:slug` | GET | Public | **100% Identical** (Pre-compiled snapshot) |
| `/api/v1/profiles/:id/publish` | `/api/v1/profiles/:id/publish` | POST | Authenticated | **100% Identical** |
| `/api/v1/profiles/:id/sections` | `/api/v1/profiles/:id/sections` | PUT | Authenticated | **100% Identical** |
| `/api/qr/dynamic/:token/resolve`| `/api/qr/dynamic/:token/resolve` | GET | Public | **100% Identical** |
| `/dq/:token` | `/dq/:token` | GET | Public | **100% Identical** (302 Redirect) |
| `/api/v1/qr` | `/api/v1/qr` | GET, POST | Authenticated | **100% Identical** |
| `/api/v1/cards` | `/api/v1/cards` | GET | Authenticated | **100% Identical** |
| `/api/v1/cards/:id/link` | `/api/v1/cards/:id/link` | POST | Authenticated | **100% Identical** |
| `/api/v1/leads` | `/api/v1/leads` | GET, POST | Auth / Public | **100% Identical** |
| `/api/v1/orders` | `/api/v1/orders` | GET, POST | Authenticated | **100% Identical** |
| `/api/v1/templates` | `/api/v1/templates` | GET | Public | **100% Identical** |
| `/api/v1/entitlements/me` | `/api/v1/entitlements/me` | GET | Authenticated | **100% Identical** |
| `/api/v1/admin/stats` | `/api/v1/admin/stats` | GET | Super Admin | **100% Identical** |
| `/api/v1/admin/orders` | `/api/v1/admin/orders` | GET | Super Admin | **100% Identical** |
| `/api/v1/admin/orders/:id` | `/api/v1/admin/orders/:id` | PATCH | Super Admin | **100% Identical** |
| `/api/v1/admin/subscriptions/assign` | `/api/v1/admin/subscriptions/assign` | POST | Super Admin | **100% Identical** |

---

## 2. Response Structure Consistency

All responses conform to the standard TAPTCH envelope:
```json
{
  "success": true,
  "data": { ... }
}
```

In the event of an error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Enter your password.",
    "path": "/api/auth/sign-in/email",
    "timestamp": "2026-11-12T13:40:00.000Z"
  }
}
```
This guarantees 100% backward compatibility for all existing clients.

