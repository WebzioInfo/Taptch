# TAPTCH — Complete Backend API Inventory

This document maps all 42 Next.js API route handlers to their corresponding NestJS Controller, HTTP method, request payload, and response contract.

---

## 1. Authentication & System Health

| Endpoint Path | Method | Current Next.js Handler | NestJS Target Controller | Auth Guard |
|---|---|---|---|---|
| `/api/health` | GET | `src/app/api/health/route.ts` | `HealthController.check()` | Public |
| `/api/ready` | GET | `src/app/api/ready/route.ts` | `HealthController.ready()` | Public |
| `/api/auth/*` | ALL | `src/app/api/auth/[...all]/route.ts` | `AuthController.*` | Public / Session |

---

## 2. Digital Profiles & Templates

| Endpoint Path | Method | Current Next.js Handler | NestJS Target Controller | Auth Guard |
|---|---|---|---|---|
| `/api/v1/profiles` | GET | `src/app/api/v1/profiles/route.ts` | `ProfilesController.findAll()` | User / Org |
| `/api/v1/profiles` | POST | `src/app/api/v1/profiles/route.ts` | `ProfilesController.create()` | User / Org |
| `/api/v1/profiles/:id` | GET | `src/app/api/v1/profiles/[id]/route.ts` | `ProfilesController.findOne()` | User / Public (if published) |
| `/api/v1/profiles/:id` | PATCH | `src/app/api/v1/profiles/[id]/route.ts` | `ProfilesController.update()` | User (Owner) |
| `/api/v1/profiles/:id/publish` | POST | `src/app/api/v1/profiles/[id]/publish/route.ts` | `ProfilesController.publish()` | User (Owner) |
| `/api/v1/profiles/:id/request-publication` | POST | `src/app/api/v1/profiles/[id]/request-publication/route.ts` | `ProfilesController.requestPublication()` | User (Owner) |
| `/api/v1/profiles/:id/exchange` | POST | `src/app/api/v1/profiles/[id]/exchange/route.ts` | `ProfilesController.exchangeContact()` | Public (Rate Limited) |
| `/api/v1/profiles/:id/sections` | PUT | `src/app/api/v1/profiles/[id]/sections/route.ts` | `ProfilesController.updateSections()` | User (Owner) |
| `/api/v1/profiles/:id/businesses` | GET | `src/app/api/v1/profiles/[id]/businesses/route.ts` | `ProfilesController.getBusinesses()` | User (Owner) |
| `/api/v1/profiles/:id/businesses` | POST | `src/app/api/v1/profiles/[id]/businesses/route.ts` | `ProfilesController.addBusiness()` | User (Owner) |
| `/api/v1/profiles/:id/businesses/:bizId` | PUT | `src/app/api/v1/profiles/[id]/businesses/[bizId]/route.ts` | `ProfilesController.updateBusiness()` | User (Owner) |
| `/api/v1/profiles/:id/businesses/:bizId` | DELETE | `src/app/api/v1/profiles/[id]/businesses/[bizId]/route.ts` | `ProfilesController.deleteBusiness()` | User (Owner) |
| `/api/v1/profiles/:id/catalogue` | GET | `src/app/api/v1/profiles/[id]/catalogue/route.ts` | `ProfilesController.getCatalogue()` | User (Owner) |
| `/api/v1/profiles/:id/catalogue` | POST | `src/app/api/v1/profiles/[id]/catalogue/route.ts` | `ProfilesController.addCatalogueItem()` | User (Owner) |
| `/api/v1/profiles/:id/catalogue/:catId` | PUT | `src/app/api/v1/profiles/[id]/catalogue/[catId]/route.ts` | `ProfilesController.updateCatalogueItem()` | User (Owner) |
| `/api/v1/profiles/:id/catalogue/:catId` | DELETE | `src/app/api/v1/profiles/[id]/catalogue/[catId]/route.ts` | `ProfilesController.deleteCatalogueItem()` | User (Owner) |
| `/api/v1/templates` | GET | `src/app/api/v1/templates/route.ts` | `TemplatesController.findAll()` | Public |
| `/api/v1/templates/:id` | GET | `src/app/api/v1/templates/[id]/route.ts` | `TemplatesController.findOne()` | Public |
| `/api/v1/admin/templates` | GET, POST | `src/app/api/v1/admin/templates/route.ts` | `AdminTemplatesController.*` | Super Admin |
| `/api/v1/admin/templates/:id` | PATCH | `src/app/api/v1/admin/templates/[id]/route.ts` | `AdminTemplatesController.update()` | Super Admin |

---

## 3. Dynamic QR & NFC Engine

| Endpoint Path | Method | Current Next.js Handler | NestJS Target Controller | Auth Guard |
|---|---|---|---|---|
| `/api/qr/dynamic/:token/resolve` | GET | `src/app/api/qr/dynamic/[token]/resolve/route.ts` | `QrRedirectController.resolveToken()` | Public |
| `/api/v1/qr` | GET, POST | `src/app/api/v1/qr/route.ts` | `QrController.findOrCreate()` | User / Org |
| `/api/v1/qr/:id` | GET, PATCH | `src/app/api/v1/qr/[id]/route.ts` | `QrController.findOrUpdate()` | User (Owner) |
| `/api/v1/qr/batches` | GET, POST | `src/app/api/v1/qr/batches/route.ts` | `QrBatchesController.findOrCreate()` | Super Admin |
| `/api/v1/qr/batches/:id` | GET | `src/app/api/v1/qr/batches/[id]/route.ts` | `QrBatchesController.findOne()` | Super Admin |
| `/api/v1/qr/batches/:id/export` | GET | `src/app/api/v1/qr/batches/[id]/export/route.ts` | `QrBatchesController.exportBatchPdf()` | Super Admin |
| `/api/admin/qr/dynamic/analytics` | GET | `src/app/api/admin/qr/dynamic/analytics/route.ts` | `AdminQrController.getAnalytics()` | Super Admin |
| `/api/admin/sales/assign-qr` | POST | `src/app/api/admin/sales/assign-qr/route.ts` | `AdminSalesController.assignQr()` | Super Admin / Staff |

---

## 4. Cards, Leads, Orders & Subscriptions

| Endpoint Path | Method | Current Next.js Handler | NestJS Target Controller | Auth Guard |
|---|---|---|---|---|
| `/api/v1/cards` | GET, POST | `src/app/api/v1/cards/route.ts` | `CardsController.findOrCreate()` | User / Org |
| `/api/v1/cards/:id/link` | POST | `src/app/api/v1/cards/[id]/link/route.ts` | `CardsController.linkToProfile()` | User (Owner) |
| `/api/v1/leads` | GET, POST | `src/app/api/v1/leads/route.ts` | `LeadsController.findOrCreate()` | User / Public (POST) |
| `/api/v1/orders` | GET, POST | `src/app/api/v1/orders/route.ts` | `OrdersController.findOrCreate()` | User / Org |
| `/api/v1/admin/orders` | GET | `src/app/api/v1/admin/orders/route.ts` | `AdminOrdersController.findAll()` | Super Admin |
| `/api/v1/admin/orders/:id` | PATCH | `src/app/api/v1/admin/orders/[id]/route.ts` | `AdminOrdersController.update()` | Super Admin |
| `/api/v1/entitlements/me` | GET | `src/app/api/v1/entitlements/me/route.ts` | `EntitlementsController.getMine()` | Authenticated User |
| `/api/v1/admin/subscriptions/assign` | POST | `src/app/api/v1/admin/subscriptions/assign/route.ts` | `AdminSubscriptionsController.assign()` | Super Admin |
| `/api/v1/admin/publications` | GET | `src/app/api/v1/admin/publications/route.ts` | `AdminPublicationsController.findAll()` | Super Admin |
| `/api/v1/admin/publications/:id/review` | POST | `src/app/api/v1/admin/publications/[id]/review/route.ts` | `AdminPublicationsController.review()` | Super Admin |
| `/api/v1/admin/stats` | GET | `src/app/api/v1/admin/stats/route.ts` | `AdminStatsController.getOverview()` | Super Admin |

---

## 5. Media & Asset Management

| Endpoint Path | Method | Current Next.js Handler | NestJS Target Controller | Auth Guard |
|---|---|---|---|---|
| `/api/v1/media/upload` | POST | `src/app/api/v1/media/upload/route.ts` | `MediaController.uploadFile()` | Authenticated User |
| `/api/v1/media/signature` | POST | `src/app/api/v1/media/signature/route.ts` | `MediaController.getUploadSignature()` | Authenticated User |
| `/api/v1/media/:id` | DELETE | `src/app/api/v1/media/[id]/route.ts` | `MediaController.deleteMedia()` | User (Owner) |
| `/api/v1/admin/media` | GET | `src/app/api/v1/admin/media/route.ts` | `AdminMediaController.findAll()` | Super Admin |

---

## 6. Organizations & Staff

| Endpoint Path | Method | Current Next.js Handler | NestJS Target Controller | Auth Guard |
|---|---|---|---|---|
| `/api/v1/orgs` | GET, POST | `src/app/api/v1/orgs/route.ts` | `OrgsController.findOrCreate()` | Authenticated User |
| `/api/v1/orgs/:id` | GET | `src/app/api/v1/orgs/[id]/route.ts` | `OrgsController.findOne()` | Org Member |
| `/api/v1/orgs/:id/audit` | GET | `src/app/api/v1/orgs/[id]/audit/route.ts` | `OrgsController.getAuditTrail()` | Org Admin |
| `/api/v1/orgs/:id/staff` | GET, POST | `src/app/api/v1/orgs/[id]/staff/route.ts` | `OrgsController.manageStaff()` | Org Admin |
| `/api/v1/orgs/:id/staff/dashboard` | GET | `src/app/api/v1/orgs/[id]/staff/dashboard/route.ts` | `OrgsController.getStaffDashboard()` | Staff Member |
| `/api/v1/orgs/:id/staff/:memberId` | PATCH | `src/app/api/v1/orgs/[id]/staff/[memberId]/route.ts` | `OrgsController.updateStaffMember()` | Org Admin |
| `/api/v1/orgs/invitations/:id/accept` | POST | `src/app/api/v1/orgs/invitations/[id]/accept/route.ts` | `OrgsController.acceptInvite()` | Authenticated User |
| `/api/v1/orgs/invitations/:id/reject` | POST | `src/app/api/v1/orgs/invitations/[id]/reject/route.ts` | `OrgsController.rejectInvite()` | Authenticated User |
| `/api/admin/staff` | GET, POST | `src/app/api/admin/staff/route.ts` | `AdminStaffController.findOrCreate()` | Super Admin |
| `/api/admin/staff/:id/status` | PATCH | `src/app/api/admin/staff/[id]/status/route.ts` | `AdminStaffController.updateStatus()` | Super Admin |
| `/api/admin/staff/:id/analytics` | GET | `src/app/api/admin/staff/[id]/analytics/route.ts` | `AdminStaffController.getAnalytics()` | Super Admin |

