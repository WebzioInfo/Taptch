# Taptch Specification — 04 Profile Engine

> Source: Master Prompt Section 4

## Schema-Driven Architecture
Profiles are not static or hardcoded pages; they are dynamic, schema-driven documents backed by JSON structures validated via Zod schemas.

### Profile Model Core Attributes
- `id`: UUID v4 primary key.
- `slug`: Unique human-readable URL identifier (e.g. `/p/alex-mercer`). Stable across template changes and content edits.
- `ownerId`: Reference to User account.
- `organizationId`: Optional reference to Organization.
- `parentBusinessId`: Optional reference for multi-business hierarchy.
- `mode`: Profile mode (`BUSINESS`, `PERSONAL`, `EVENT`).
- `status`: Lifecycle state (`DRAFT`, `PUBLISHED`, `ARCHIVED`, `SUSPENDED`).
- `templateId` & `templateVersion`: Active template and lock version.
- `themeConfig`: Overrides for colors, fonts, borderRadius, and surface opacity.
- `visibility`: `PUBLIC`, `PASSWORD_PROTECTED`, or `UNLISTED`.
- `seoMetadata`: Title, description, OG image URL, canonical URL, indexing flags.
- `defaultLocale`: Primary display language (e.g. `en`, `hi`, `ml`, `ar`).
- `draftContent`: Working JSON representation of active sections and blocks.
- `publishedContent`: Production snapshot served to public visitors.
- `versionHistory`: Audit log of previous published versions allowing one-click rollback.

### Profile Section Blocks
Every profile is constructed from an ordered list of typed sections. Each block has a distinct Zod schema:
1. `IDENTITY`: Avatar, cover image, full name, badge, title, company name, logo.
2. `CONTACT_LIST`: Direct action triggers (mobile, WhatsApp, email, landline, address, directions).
3. `SOCIAL_LINKS`: Grid/list of verified social icons with native app deep links.
4. `ACTION_BUTTONS`: Custom web links, call-to-actions, highlighted destination cards.
5. `ABOUT`: Executive summary, rich markdown bio, company background.
6. `COMPANY_OVERVIEW`: Fast facts, founding year, employee count, registration.
7. `IMAGE_GALLERY`: Photo showcase with masonry/grid layout and lightbox zoom.
8. `PRODUCT_CATALOGUE`: Items with photos, SKU, price, currency, WhatsApp order link.
9. `SERVICE_CATALOGUE`: Service list with durations, starting price, and booking CTA.
10. `PORTFOLIO`: Project cards with media, case study links, and client names.
11. `DOCUMENTS`: PDF brochures, presentations, price lists, with flip-book reader or download.
12. `VIDEOS`: Responsive YouTube / Vimeo video embeds.
13. `TESTIMONIALS`: Customer quotes, avatars, ratings, and verification badges.
14. `GOOGLE_REVIEW`: Direct 5-star rating display and review submission trigger.
15. `PAYMENTS_UPI`: Indian UPI deep-link buttons (`upi://pay?...`) and dynamic QR code.
16. `BOOKING`: Calendly / Cal.com iframe or integrated date-picker slot booking.
17. `CONTACT_FORM`: Contact exchange lead capture form with consent toggle.
18. `FAQ`: Accordion list of frequently asked questions.
19. `TEAM_DIRECTORY`: Grid of affiliated team members within the organization.
20. `MAP`: Embedded interactive map or direct Google Maps route button.
21. `CUSTOM_HTML`: Sandboxed HTML strictly filtered through an allow-list sanitizer (DOMPurify).
22. `MULTI_BUSINESS_SWITCHER`: Selector to switch between parent/child businesses.

### Multi-Profile & Multi-Business Capabilities
- Users can create multiple distinct profiles under one account (subject to plan entitlements).
- A single profile can host multiple businesses with independent branding, sections, catalogues, contact info, and analytics, selectable via a visitor-facing switcher.

### Public Rendering & SEO
- Server-rendered Next.js pages with Incremental Static Regeneration (ISR) and on-demand cache revalidation upon publication.
- Exposes only intentionally published fields (`publishedContent`), safeguarding draft edits.
- Automated OpenGraph (OG) image generation via `@vercel/og` matching the chosen theme.
- Dynamic JSON-LD structured data (`Person` or `Organization` schema) for search indexation.

