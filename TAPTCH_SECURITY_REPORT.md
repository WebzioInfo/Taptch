# Taptch Product Expansion: Security & Data Protection Report

**Author:** Security & Data Privacy Engineer  
**Date:** November 2026  
**Standards:** OWASP Top 10 (2021), India Digital Personal Data Protection (DPDP) Act, Role-Based Access Control (RBAC)  

---

## 1. Threat Modeling & Mitigation Summary

### A. Honeypot Bot & Spam Mitigation on Public Forms
- **Threat:** Automated spambots submitting fake enquiries to public profile contact forms, saturating user lead inboxes and consuming database storage.
- **Defense Implemented:**
  1. *Invisible Honeypot Inputs:* Forms inject hidden inputs (`website`, `company_url`) with `display: none`, `tabindex: -1`, `aria-hidden: true`, and autocomplete disabled. Automated bots parse and populate these fields; the backend (`LeadsService.createLead`) immediately identifies the bot and returns a fake success code without saving to the database.
  2. *Duplicate Submission Throttling:* Submissions from the exact same email address to the same profile within 60 seconds are identified and rejected.
  3. *Input Sanitization:* Phone numbers are cleansed of script injection; names and messages are trimmed and sanitized.

### B. Cross-Tenant IDOR & Lead Isolation
- **Threat:** Insecure Direct Object References (IDOR) where User A accesses or modifies leads captured by User B.
- **Defense Implemented:**
  1. *Owner Discovery:* Every lead captured is mapped directly to the `owner_user_id` discovered from the target profile.
  2. *Enforced Tenancy in Queries:* `GET /api/v1/leads`, `PATCH /api/v1/leads/:id`, and `DELETE /api/v1/leads/:id` enforce `eq(leads.ownerUserId, actor.id)`. Non-owners receive HTTP 404 or HTTP 403.
  3. *Zero Leakage in Public Lead Endpoint:* The public endpoint `POST /api/v1/leads` accepts only the target `profileId`, payload data, and honeypot field, returning minimal non-sensitive confirmation.

### C. Role Separation & Privilege Escalation Defenses
- **Threat:** Operational support personnel accessing proprietary financial figures (COGS, revenue, net profit margin) or escalating their own permissions.
- **Defense Implemented:**
  1. *Hard Guard on Financial Routes:* `AdminController` financial endpoints (`/api/v1/admin/finance/*`) require `@Roles('super_admin', 'admin')`. The `support_admin` role is completely blocked and receives HTTP 403 Forbidden.
  2. *Support Operational Boundary:* `SupportController` exposes only read-only or operational moderation actions (customer lookup, card routing verification, profile audit flags).
  3. *Immutable Staff Audit Log:* Every staff action is logged with timestamp, operator ID, action name, and target reference in the database.

### D. Service Worker & PWA Cache Poisoning Defense
- **Threat:** Service worker caching authenticated API responses (e.g., user profiles, leads, financial transactions) or admin sessions, causing stale or cross-user data leakage on shared devices.
- **Defense Implemented:**
  1. *Strict URL Pattern Filtering:* `frontend/public/sw.js` explicitly excludes all URLs matching `/api/`, `/admin`, `/support`, or `/auth/`.
  2. *Static Asset Only Whitelist:* Only immutable static assets (`.js`, `.css`, `.png`, `.jpg`, `.svg`, `.woff2`) are cached under `taptch-cache-v2`.
  3. *Network First / Bypass for Dynamic Data:* All HTML navigation queries bypass cache or check network immediately.

### E. Google OAuth 2.0 Security
- **Threat:** Token substitution, CSRF in OAuth redirects, or unverified email takeovers.
- **Defense Implemented:**
  1. *PKCE / State Validation:* OAuth initiation issues state validation protecting against redirect interception.
  2. *Server-to-Server Token Exchange:* Authorization codes are exchanged directly with `https://oauth2.googleapis.com/token` over TLS, never via untrusted client proxies.
  3. *Account Linking Safety:* Verified Google emails match existing local accounts only if `emailVerified = true`, preventing account hijacking via arbitrary unverified email claiming.
