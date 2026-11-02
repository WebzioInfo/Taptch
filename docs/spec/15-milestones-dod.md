# Tapzio Specification — 15 Milestones & Definition of Done

> Source: Master Prompt Sections 15 & 16

## Milestone Roadmap
- **M0 — Audit, Specs, Design (Current Milestone)**:
  - Repo audit, save spec to `/docs/spec/`, generate core architecture and requirement documents.
  - Competitor analysis and critique matrix.
  - 3 visual directions for the public profile (hero mockups at 390px).
  - Explicit decision log and approval requests. Stop and await approval.
- **M1 — Foundation**:
  - Next.js 15 app skeleton, Docker services (Postgres, Redis, MinIO, Mailpit).
  - Brand configuration layer (`src/config/brand.ts`), Prisma schema, migrations, seeds.
  - Auth.js with OTP, Google, phone authentication, MFA for admins.
  - Centralized permission engine (`can()`), tenant-scoped data access layer, i18n, shadcn UI kit.
- **M2 — NFC / QR Core**:
  - Card models, inventory, batches, `/n/*` and `/q/*` redirect handlers with sub-50ms latency.
  - Async event logging to BullMQ, card activation, deactivation, re-assignment.
  - Dynamic QR generator (with decoding CI test), vCard 3.0/4.0 engine, encoder CLI simulation.
- **M3 — Profile Engine + Public Profiles + RLS**:
  - Section schemas, draft/publish lifecycle, version history and rollback.
  - Template engine with 3 launch templates, ISR public rendering, Save Contact, Exchange Contact.
  - PostgreSQL Row Level Security (RLS) policies, IDOR and tenancy automated tests.
  - Performance verification: Lighthouse mobile ≥ 95, LCP < 1.2s.
- **M4 — Customer Dashboard & Profile Builder**:
  - Onboarding wizard (< 3 min), three-pane builder with live 390px phone simulator.
  - Autosave with server confirmation, remaining 3 templates, multi-business switcher.
  - Media library with cropping, card management, leads inbox, personal analytics dashboard.
- **M5 — Corporate / Organization Management**:
  - Organizations, departments, designations, employee invites.
  - CSV bulk employee import with validation and downloadable error reports.
  - Background profile and card generation jobs, brand lock, team directory, team analytics.
- **M6 — Commerce & Operations**:
  - Entitlement engine and plan administration, subscriptions with Razorpay test mode.
  - Verified webhooks, Indian GST invoicing, marketing site card configurator, checkout.
  - Order manufacturing kanban, encoding station UI, print-ready 300 DPI PDF artwork generator.
- **M7 — Super Admin & Platform Control**:
  - Unified admin control console, CMS, template/section administration, feature flags.
  - Security event monitoring, API key management, audited impersonation with banner.
- **M8 — Reseller, Custom Domains & White-Label**:
  - Reseller portal, client workspaces, wholesale pricing and commission statements.
  - Dynamic white-label branding, automated custom domain DNS verification and safe host routing.
- **M9 — Extras & Production Hardening**:
  - Apple/Google Wallet pass generator (mock/prod toggle), email signature generator.
  - Virtual video call background, event mode, AI helpers, referral program.
  - Load testing, accessibility audit, security review, backup/restore verification, runbook.

## Definition of Done (Final Acceptance Criteria)
Every milestone and the final system must be demonstrated, not merely claimed:
1. **User Lifecycle**: Register/login via email OTP or Google; create, customize, reorder, and publish a profile.
2. **Public Visitor**: Seamlessly view published profile without authentication; responsive at 390px; sub-1.2s LCP.
3. **Contact Exchange**: Save Contact downloads valid vCard with photo; Exchange Contact captures lead with explicit consent.
4. **Hardware Redirection**: Inbound `/n/{token}` and `/q/{token}` redirect instantaneously to target profile; profile updates never require card reprinting or re-encoding.
5. **Security & Isolation**: Tenant isolation proven by automated tests; IDOR attacks thwarted; RLS enforced; rate limiting active.
6. **Enterprise Capabilities**: Organization manages 100+ employees via CSV; card reassignment does not lose historical leads.
7. **Operational Control**: Super admin manages orders, templates, inventory, and users without touching the raw database.
8. **Realistic Seed Data**: Seeded Indian business ecosystem across English, Malayalam, and Hindi (Doctor, Chartered Accountant, Architect, Manufacturing CEO, Restaurant Owner, Salon, Real-Estate Agent, BNI Member, Multi-business Founder).

