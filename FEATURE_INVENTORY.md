# TAPTCH — Complete Feature Inventory

This inventory documents all application features across user journeys, administrative capabilities, and public interfaces to ensure 100% preservation during the migration to React + NestJS.

---

## 1. Authentication & Identity Management

| Feature ID | Feature Name | Route(s) | Description | Target Implementation |
|---|---|---|---|---|
| AUTH-01 | Email/Password Registration | `/register` | User sign-up with password hashing (bcrypt salt >= 10) | React Form + NestJS Auth Controller |
| AUTH-02 | Email/Password Sign-In | `/login` | Authentication with detailed diagnostics and session cookie issuance | React Form + NestJS Auth Controller |
| AUTH-03 | Password Reset Request | `/forgot-password` | Initiates email verification code or reset link | React Form + NestJS Mailer |
| AUTH-04 | Password Reset Execution | `/reset-password` | Validates token and resets credentials | React Form + NestJS Auth Service |
| AUTH-05 | Email & OTP Verification | `/verify` | Validates 6-digit verification code | React OTP Input + NestJS Auth Service |
| AUTH-06 | Organization Invite Claim | `/invite/:id` | Accepts or declines organization membership invitation | React Invite Claim + NestJS Org Service |
| AUTH-07 | Session Management | All App Pages | HTTP-only session cookies, silent session refresh, logout | TanStack Query + NestJS Auth Guard |

---

## 2. Digital Profile Engine & Design Studio

| Feature ID | Feature Name | Route(s) | Description | Target Implementation |
|---|---|---|---|---|
| PROF-01 | Profile Dashboard | `/dashboard` | Lists user's digital profiles, quick analytics, card statuses | React Dashboard + TanStack Query |
| PROF-02 | Profile Studio Builder | `/builder/:id`, `/builder/new` | Full design studio with dual-device live preview | React Studio + NestJS Profile Controller |
| PROF-03 | Drag-and-Drop Sections | `/builder/:id` | Reorder contact info, socials, gallery, custom links, catalogues | `@dnd-kit/core` + NestJS Section Endpoint |
| PROF-04 | Business & Catalogue Association | `/builder/:id` | Add multi-business cards, products, services, PDFs | React Modal + NestJS Business API |
| PROF-05 | Template Switching | `/builder/:id` | Switch between 6 luxury themes without data loss | React Theme Selector + Shared Theme Config |
| PROF-06 | Publication Workflow | `/builder/:id` | Draft saving, snapshot pre-compilation, publication request | React Publish Button + NestJS Publish Service |
| PROF-07 | Public Digital Profile | `/p/:slug` | High-speed, mobile-optimized public identity page | React Profile Page + NestJS Public API (<50ms) |
| PROF-08 | Direct Contact Exchange (vCard) | `/p/:slug` | Lead capture modal, downloads .vcf contact card | React Modal + NestJS Lead Service |

---

## 3. Dynamic QR & NFC Engine

| Feature ID | Feature Name | Route(s) | Description | Target Implementation |
|---|---|---|---|---|
| QR-01 | Dynamic QR Dashboard | `/qr` | Create, edit, categorized dynamic QR codes with live analytics | React QR View + NestJS QR Controller |
| QR-02 | High-Speed QR Resolution | `/dq/:token`, `/q/:token` | Resolves token to destination (<50ms) using Redis cache-aside | NestJS Redirect Controller + Redis |
| QR-03 | NFC Card Claim Flow | `/claim/:token`, `/n/:token` | Tap unregistered NFC card, login/register, bind to profile | React Claim Page + NestJS Card Controller |
| QR-04 | Post-Print Batch Activation | `/portal-x/qr-management` | Super Admin / Staff activates pre-printed physical batches | React Admin View + NestJS Batch Service |
| QR-05 | Print Sheet PDF Generation | `/portal-x/qr-management` | Generates high-resolution printable PDF sheets | NestJS Print Engine (`pdf-lib`) |
| QR-06 | Scan Analytics Logging | Background | Privacy-safe IP hashing (DPDP Act), device & geo tracking | NestJS Analytics Interceptor / BullMQ |

---

## 4. Multi-Tenant Organization & Staff Hierarchy

| Feature ID | Feature Name | Route(s) | Description | Target Implementation |
|---|---|---|---|---|
| ORG-01 | Organization Management | `/team` | Manage team members, departments, invitations | React Team View + NestJS Org Controller |
| ORG-02 | Staff Portal & Login | `/staff/login`, `/staff/dashboard` | Dedicated staff cockpit for sales and card distribution | React Staff View + NestJS Staff Controller |
| ORG-03 | Physical Card Assignment | `/staff/assign/:token` | Staff binds dynamic QR or card on the ground | React Mobile Scanner + NestJS Assign API |
| ORG-04 | Staff Activity & History | `/staff/history` | Audit trail of physical card distributions and sales | React Table + NestJS Staff Audit API |

---

## 5. Administration & Super Admin (Portal-X)

| Feature ID | Feature Name | Route(s) | Description | Target Implementation |
|---|---|---|---|---|
| ADM-01 | Super Admin Overview | `/admin` | Tenant metrics, user counts, system health | React Admin Overview + NestJS Admin Stats |
| ADM-02 | Global Analytics Engine | `/portal-x/analytics` | Aggregated scans, active users, top profiles | React Charts + NestJS Admin Analytics |
| ADM-03 | Publication Review Queue | `/admin` | Review public profile publication requests | React Review Table + NestJS Review API |
| ADM-04 | Subscription & Entitlements | `/admin` | Manually assign plans (`nano`, `micro`, `mini`, `max`) | React Plan Modal + NestJS Plan Service |
| ADM-05 | Card Orders Oversight | `/admin` | Review physical card order requests and update payment status | React Orders View + NestJS Orders Service |

---

## 6. Public Marketing & SEO

| Feature ID | Feature Name | Route(s) | Description | Target Implementation |
|---|---|---|---|---|
| MKT-01 | Marketing Landing Page | `/` | Hero, feature breakdown, luxury card showcase, CTA | React Landing Page + Vite |
| MKT-02 | Product Detail Pages | `/digital-business-card`, `/nfc-business-card` | SEO-optimized educational landing pages | React Landing Pages + Meta Tags |
| MKT-03 | Pricing & Plan Comparison | `/pricing` | 4-tier plan comparison table with dynamic features | React Pricing Page + Brand Config |
| MKT-04 | Template Showcase Gallery | `/templates`, `/templates/:id` | Interactive template explorer with preview mode | React Showcase + Mock Preview |
| MKT-05 | Informational Pages | `/about`, `/contact`, `/faq`, `/how-it-works` | Brand editorial pages | React Static Pages |

