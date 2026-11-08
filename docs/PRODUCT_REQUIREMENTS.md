# Taptch — Product Requirements Document (PRD)
## Comprehensive Product Vision & Architecture Directive

**Product:** Taptch  
**Platform Owner:** Webzio Technology  
**Classification:** Self-Service Digital Identity, Profile Creation & Smart-Hardware Platform  
**Document Version:** 2.0 (Product Vision Realignment)  
**Status:** Approved & Authoritative

---

## 1. Executive Product Vision & Core Principle

**Taptch is a self-service digital profile creation platform and customizable digital identity SaaS.**

> [!IMPORTANT]
> **Core Principle: Digital Profile is the Primary Product.**  
> Physical NFC smart cards (matte PVC, executive metal, brushed gold, carbon finish) are optional premium physical accessories that instantly link people to their live digital profile. Taptch is not merely an NFC card store or a collection of static web cards; it is an end-to-end digital identity creation platform where users choose how they look, showcase their personal brand and multiple businesses, publish live, and optionally connect physical NFC hardware.

### The 14-Step Core User Journey
1. Register and sign in with email/phone OTP or password.
2. Select profile mode: **Personal Profile** or **Single Business Profile**.
3. Choose a subscription plan (**Nano**, **Micro**, **Mini**, **Max**).
4. Create one or multiple digital profiles according to plan entitlements.
5. Browse the professional **Template Gallery** with category, industry, and profile type filters.
6. Open interactive desktop and mobile template previews.
7. Select a template without losing profile data.
8. Upload personal/business info, photos, logos, products, services, and galleries.
9. Customize styling (colors, typography, button styles, section visibility and ordering).
10. Preview live changes in real time.
11. Publish the profile with a unique unguessable public slug (`/p/{slug}`).
12. Generate dynamic QR codes and share public links across any channel.
13. Optionally order physical NFC smart cards (PVC or executive metal).
14. Connect the physical NFC card directly to the published profile for instantaneous tap-to-profile discovery.

---

## 2. User Types & Profile Creation Modes

Taptch supports two distinct profile creation architectures designed for modern networking:

### 2.1 Mode A: Personal Profile (with Multiple Business Support)

Designed for professionals, entrepreneurs, consultants, creators, and founders who represent both their personal identity and multiple ventures.

#### A. Personal Identity Layer
- Full Name & Professional Designation / Headline.
- High-resolution Profile Photograph & Cover Banner.
- Personal Introduction / Biography.
- Primary Contact Methods: Direct Phone (E.164), WhatsApp Click-to-Chat, Email.
- Social Links (LinkedIn, X/Twitter, Instagram, GitHub, YouTube, etc.).
- Portfolio Links, Skills, Work Experience, Education, Achievements.
- Personal Image Gallery & Video Highlights.
- Location / Base City.
- **Save Contact (vCard 3.0/4.0)**: Instant 1-tap download of contact file into iOS/Android native address book.
- **Contact Exchange**: Reciprocal lead capture form allowing visitors to share their contact details back.

#### B. Multiple Business Association Layer (Crucial Architecture)
One individual often manages or owns multiple businesses (e.g. John Mathew owns *ABC Technologies*, *XYZ Enterprises*, and *ABC Properties*).
- **Zero Account Fragmentation**: The user does NOT need separate user logins or separate subscription accounts for each business.
- **Business Showcase Section**: The personal profile displays an elegant multi-business showcase or interactive switcher.
- **Per-Business Data Structure**: Each associated business possesses its own:
  - Business Name & Tagline.
  - Company Logo & Cover Image.
  - Business Description & Overview.
  - Dedicated Website URL.
  - Dedicated Contact Information (Business Phone, Email, WhatsApp).
  - Physical Office Address & Google Maps link.
  - Business Social Media Channels.
  - Featured Products & Service Catalogue items.
  - Business-Specific Photo Gallery.
- All associated businesses are managed, edited, and ordered from a single unified user dashboard.

---

### 2.2 Mode B: Single Business Profile

Designed for corporate companies, retail establishments, medical clinics, hospitality ventures, and single-entity enterprises.

#### Business Information Architecture
- Registered Company Name & Brand Tagline.
- High-Resolution Company Logo & Header Cover Banner.
- Comprehensive Company Introduction & "About Us".
- Corporate Contact Details (General Phone, Inquiries Email, Support WhatsApp).
- Headquarters & Branch Address with interactive Google Maps navigation link.
- Official Website & Verified Social Media Channels.
- **Product Catalogue**: Rich product cards with image, price (INR), description, and direct enquiry/WhatsApp action button.
- **Service Catalogue**: Detailed service cards highlighting deliverables, process, and consultation booking.
- **Brochure Downloads**: Downloadable PDF company profile or product catalogue.
- **Google Reviews Integration**: Direct 1-tap Google Review submission link.
- **Corporate Photo Gallery & Promotional YouTube Videos**.
- **Contact Saving & Lead Capture**: Corporate vCard download and visitor contact exchange form with GDPR/DPDP consent.

---

## 3. Subscription Plans & Feature Entitlements

Taptch implements a flexible, admin-managed entitlement system. Plans are data-driven in PostgreSQL, allowing administrators to dynamically alter pricing, feature flags, and limits without altering frontend code.

### 3.1 Initial Four-Tier Plan Architecture

| Feature / Capability | Nano (Tier 1) | Micro (Tier 2) | Mini (Tier 3) | Max (Tier 4) |
| :--- | :---: | :---: | :---: | :---: |
| **Profile Photograph & Avatar** | Yes | Yes | Yes | Yes |
| **Primary Contact Details (Phone, Email, WhatsApp)** | Yes | Yes | Yes | Yes |
| **Website & Social Media Links** | Yes | Yes | Yes | Yes |
| **Company Logo** | Yes | Yes | Yes | Yes |
| **Save Contact (vCard)** | Yes | Yes | Yes | Yes |
| **Max Profiles per Account** | 1 | 2 | 5 | 20 |
| **Company Overview / Extended Bio** | No | Yes | Yes | Yes |
| **Contact Exchange / Lead Capture** | No | Yes | Yes | Yes |
| **Image Gallery** | No | Yes (Up to 5 images) | Yes (Up to 15 images) | Yes (Up to 50 images) |
| **Google Maps Location** | No | Yes | Yes | Yes |
| **Multi-Business Support (Personal Profile)** | 0 | 1 Business | Up to 3 Businesses | Up to 10 Businesses |
| **Product Catalogue** | No | No | Yes (Up to 10 items) | Yes (Up to 50 items) |
| **Service Catalogue** | No | No | No | Yes (Up to 50 items) |
| **Downloadable PDF Brochure** | No | No | No | Yes |
| **Embedded YouTube Videos** | No | No | No | Yes |
| **Google Review Quick Link** | No | No | No | Yes |
| **Custom Domain Support** | No | No | No | Yes |
| **White-Label (Remove Taptch Badge)** | No | No | No | Yes |

### 3.2 Plan Administration Capabilities (Super Admin Console)
Platform administrators can:
1. Create, update, or deactivate subscription plans.
2. Set prices, billing cycles, and promotional tags.
3. Configure numerical limits: profile limit, business limit, product limit, service limit, image limit.
4. Toggle section feature flags on/off per plan.
5. Control template tier access (e.g. exclusive luxury templates restricted to Mini or Max).
6. Manually assign plans, upgrade users, extend validity, or apply custom bespoke entitlements.

### 3.3 Backend-Enforced Entitlements (Non-Negotiable)
- All entitlement rules are enforced server-side by the centralized `EntitlementEngine` (`src/modules/entitlements`).
- Hiding UI buttons in the client is purely a UX affordance. Any unauthorized API attempt to add gallery images, products, or additional businesses beyond plan quotas throws an explicit `EntitlementLimitExceededError`.

---

## 4. Template Gallery — Discovery & Marketplace

Inspired by reference platforms (e.g. `tangerine-chaja-02bf37.netlify.app`), the Template Gallery is a centerpiece feature.

### 4.1 Gallery Capabilities
- **Visual Discovery**: High-contrast, responsive card grid showcasing rendered template previews.
- **Search & Filtering**:
  - Full-text search across template names and styles.
  - **Category Filters**: Personal, Professional, Corporate, Business, Entrepreneur, Creative, Freelancer, Consultant, Real Estate, Healthcare, Tech, Hospitality, Agency, Photography.
  - **Profile Mode Filters**: Personal Profile compatible vs. Single Business compatible.
  - **Plan Eligibility Filter**: Free/Nano, Micro, Mini, Max.
  - **Badge Tags**: `Featured`, `Popular`, `New`, `Executive`.
- **Dual Device Preview Modal**: Full-screen preview dialog allowing users to test how the template renders on both desktop and mobile viewports before choosing it.
- **Separation of Presentation & Data**: Profile content is stored in normalized schema/JSON. Switching from Template A to Template B instantly re-renders the user's data in the new design without data loss.

---

## 5. Profile Builder & Live Customization

The self-service editor empowers non-technical users to build and style their digital identity with real-time feedback.

### 5.1 Three-Pane Builder Architecture
- **Left Navigation**: Section list (Identity, Contacts, Socials, Businesses, Catalogue, Gallery, Styling, Settings). Allows toggling section visibility and dragging to reorder display sequence.
- **Center Form Workspace**: Focused input fields for the active section with instant auto-save to draft state.
- **Right Live Preview**: Interactive, responsive device mock (iPhone/Android bezel) rendering the real profile view with active theme changes applied in real time.

### 5.2 Style Customization Controls
- **Color Palette**: Preset themes (Obsidian Luxury, Ivory Minimal, Aurora Modern, Midnight Cobalt, Emerald Executive) plus custom primary, background, and card accent pickers.
- **Typography**: Curated typography pairings (Modern Sans, Classic Serif, Tech Monospace, Indic Bilingual).
- **Button Styling**: Solid gold gradient, outline, soft pill, sharp geometric.
- **Border Radius & Spacing**: Customizable corner curvature for cards, avatars, and buttons.

---

## 6. Public Profile & Edge Rendering

- **Public Route**: Published profiles are accessible via clean URLs: `https://taptch.com/p/{slug}`.
- **Sub-50ms Hot Path**: Cached published JSON snapshot stored in Redis; zero dynamic server cookies or headers on the public read path.
- **Dynamic QR Code**: High-resolution vector QR code generated on the fly, encoding the public profile URL with downloadable SVG and PNG formats.
- **SEO & Social Open Graph**: Automated dynamic meta tags, page title, description, and OG image for sharing across WhatsApp, iMessage, and LinkedIn.

---

## 7. Physical NFC Smart Cards & Hardware Workflow

Physical NFC cards connect physical interactions to the digital profile.

### 7.1 Materials & Products
- **Matte PVC Smart Card**: Durable, lightweight, water-resistant with custom edge-to-edge printing.
- **Executive Metal Smart Card**: Heavyweight stainless steel or titanium alloy with laser-engraved details and an integrated anti-metal ferrite shielding layer.

### 7.2 Hardware Lifecycle & Redirect Routing
1. **Manufacturer Pre-Encoding**: Cards are pre-programmed with unguessable redirect URLs: `https://taptch.com/n/{token}` for NFC, `https://taptch.com/q/{token}` for QR.
2. **Order Placement**: User selects card material, specifies quantity, and selects which published profile to link.
3. **Admin Verification & Kanban**: Super admin reviews order, verifies offline payment status (`unpaid` | `paid_offline` | `waived`), assigns physical card inventory from stock, and dispatches the card.
4. **Card Activation**: User taps card or scans welcome packaging QR, enters 6-digit activation code, and links the card to their active profile.
5. **Dynamic Reassignment**: If the cardholder updates their profile or changes business roles, the card can be reassigned to a different profile instantly without re-encoding the hardware chip.

---

## 8. User & Admin Dashboards

### 8.1 User Dashboard (`/dashboard`)
- **Executive Overview**: Welcome banner, active tier badge, and quick action shortcuts.
- **My Profiles**: List of active profiles with 1-click status toggle (`draft` vs `published`), edit button, and view live link.
- **My Businesses**: Dedicated management for associated child businesses under personal profiles.
- **Template Gallery Access**: Direct shortcut to browse and apply new templates.
- **NFC Hardware Management**: View linked cards, check activation status, or order new cards.
- **Contact Exchanges / Leads**: Table of incoming networking leads with search and CSV export.
- **Plan Quotas**: Real-time progress bars showing used vs. available quota for profiles, businesses, products, and images.

### 8.2 Admin Cockpit (`/admin`)
- **User & Account Management**: Search, suspend, activate users; view assigned plans.
- **Plan & Entitlement Manager**: Dynamic plan creator and entitlement matrix editor.
- **Template Manager**: Add, edit, categorize, and feature templates.
- **NFC Inventory & Batch Management**: Pre-generate card tokens, track physical stock.
- **Order Fulfilment Kanban**: Manage hardware orders, verify payments, track shipping.
- **Platform Analytics**: Global view counts, tap metrics, lead exchange volume, and audit logs.
