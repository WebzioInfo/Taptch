# Taptch Specification — 11 Billing, Entitlements & Hardware Commerce

> Source: Master Prompt Section 11

## Dynamic Entitlement Engine (ACTIVE — Initial Release)
Plan parameters and account limits are stored as dynamic data records in the database, never hardcoded in application logic.
- **Entitlement Dimensions**:
  - `max_profiles`: Number of active profiles allowed.
  - `max_businesses_per_profile`: Maximum child businesses attached to a profile.
  - `max_cards`: Active NFC cards linked.
  - `max_team_members`: Number of corporate employee seats.
  - `max_gallery_images`: Media library quota.
  - `max_catalogue_items`: Products/services limit.
  - `analytics_retention_days`: 30, 90, 365, or unlimited days.
  - `custom_domain_allowed`: Boolean.
  - `white_label_enabled`: Remove Taptch branding.
  - `api_access_enabled`: REST API keys enabled.
  - `premium_templates_allowed`: Access to luxury studio templates.
- **Enforcement & Administration**:
  - Plans (`free`, `pro`, `business`, `enterprise`) are assigned **manually by Super Admin** or assigned default `free` upon registration.
  - Checked synchronously in `src/modules/entitlements` before creating or updating any constrained resource. Zero money movement or online payment requirement in this release.

## Physical Card Order Requests (ACTIVE — Initial Release)
Physical card purchases operate as manual order requests without online payment gateways:
1. **Order Pipeline**:
   - `requested` → `design_review` → `approved` → `in_production` → `encoding` → `qc` → `shipped` → `delivered` → `cancelled`.
2. **Manual Payment Auditing**:
   - `payment_status` field (`unpaid` | `paid_offline` | `waived`), updated manually by administrators with an optional free-text reference note.
3. **Print-Ready Artwork Generation**:
   - Automated export of 300 DPI PDF artwork with 3mm bleed, crop marks, vector cardholder name, and unique generated dynamic QR code for that card's unguessable token.

---

## DEFERRED — Phase 2: Online Payment Gateway & Automated Subscriptions
> The following capabilities are explicitly deferred to Phase 2. No code, payment dependencies, or SDKs are included in the initial release.

1. **Razorpay / Stripe Payment Gateway SDKs**:
   - Automated checkout modals, recurring subscriptions, UPI Autopay e-mandates.
   - Webhook signature verification (`X-Razorpay-Signature`).
   - Automated renewal tracking, failed payment retries, and customer billing portals.
2. **Automated Indian GST Invoicing**:
   - Automated calculation of CGST (9%) + SGST (9%) or IGST (18%) based on customer GSTIN state code.
   - Generation of official serial-numbered PDF tax invoices with SAC/HSN codes and digital signatures.
3. **Refunds & Automated Credit Notes**:
   - Automated gateway chargeback handling and credit note generation.


