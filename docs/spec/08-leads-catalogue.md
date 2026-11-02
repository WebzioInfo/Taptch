# Tapzio Specification — 08 Contact Exchange, Leads & Catalogue

> Source: Master Prompt Section 8

## Contact Exchange (Lead Capture Engine)
Unlike traditional one-way cards, Tapzio facilitates bidirectional networking through an interactive modal on the public profile:
- Fields collected:
  - Full Name (required)
  - Mobile Number (required, E.164 validated)
  - Email Address (optional, RFC 5322 validated)
  - Company & Designation (optional)
  - Personal Website / LinkedIn URL (optional)
  - Message / Note (optional)
  - **Explicit Consent Checkbox** (required: *"I agree to share my contact information with [Cardholder/Company] for business networking"*).
- Anti-Abuse & Spam Protection:
  - Cloudflare Turnstile bot challenge.
  - Per-IP and per-profile velocity limits (Redis leaky bucket).
  - Duplicate submission suppression within 1 hour.
- Immediate Actions on Capture:
  - Lead stored with reference to `profileId`, `organizationId`, and attribution source (`nfc`, `qr`, `web`).
  - Asynchronous owner notification via email / WhatsApp alert / in-app notification.
  - Optional instant reciprocal contact download: Visitor receives cardholder's vCard upon submitting.

## Lead CRM & Pipeline Management
- **Status Lifecycle Stages**:
  - `NEW` → `CONTACTED` → `QUALIFIED` → `CONVERTED` → `LOST`
- **Dashboard Capabilities**:
  - Full-text search and filtering by date range, lead status, card source, and assigned team member.
  - Interactive activity timeline with notes, call logs, and meeting reminders.
  - One-tap quick actions: Call (`tel:`), WhatsApp chat (`wa.me`), and Email (`mailto:`).
  - Bulk CSV export with full contact metadata for import into HubSpot, Salesforce, or Zoho CRM.
  - Automated customizable thank-you email/WhatsApp template dispatched to newly captured leads.

## Product & Service Catalogue
The profile includes a modular digital catalogue allowing direct lead generation or transactions:
- **Product Model**:
  - Name, description, high-resolution product photos.
  - SKU, inventory status, price, and currency (INR default, USD, AED, EUR).
  - Primary CTA: Direct WhatsApp Order Link (prefills product title and price) or External Purchase URL.
- **Service Model**:
  - Service title, detailed scope of work, duration estimate.
  - Pricing information (Fixed, Hourly, Starting At, or Request Quote).
  - Primary CTA: Integrated Appointment Booking Link or Direct Inquiry Form.
- **Enterprise Inheritance**:
  - Corporate organizations can curate a central company-wide catalogue that employees can selectively import or display on their corporate profiles.

