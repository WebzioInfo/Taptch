# Taptch Profile Builder — Complete Field Inventory & Architecture Audit

## 1. Overview
This document represents an exhaustive, code-level inventory and architecture audit of all profile fields across the **Taptch Profile Creation Studio** (`/builder/new` and `/builder/:profileId`), backend microservices, PostgreSQL database schema (`profiles`, `profile_businesses`, `profile_catalogue_items`, `profile_sections`), DTO mappings, live smartphone simulator, and public profile renderers (`/p/[slug]` and `/:slug`).

---

## 2. Complete Field Inventory Matrix

| # | Field Name | Profile Type | Form Component / Tab | State Property | Input Type | Validation Rules | Preview Destination | Database Property | API DTO Mapping | Save Draft Behavior | Publish Behavior | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Full Display Name** | Both (`personal`, `business`) | `Identity & Card` / `Company Info` | `displayName` | `text` | Required; trimmed; max 128 chars | Profile Hero Name & Initials | `profiles.display_name` | `displayName` | Persisted directly in `profiles` | Embedded in `published_json` & SSR | ✅ Verified |
| 2 | **Public Card Handle / Slug** | Both (`personal`, `business`) | `Identity & Card` / `Company Info` | `slug` | `text` / `slug` | Required; lowercase; alphanumeric + hyphen; reserved-word check; unique | Public Profile URL & QR Target | `profiles.slug` | `slug` | Persisted; validates uniqueness against collisions | Immutable public routing key; cached in Redis | ✅ Verified |
| 3 | **Professional Headline / Role** | Both (`personal`, `business`) | `Identity & Card` / `Company Info` | `headline` | `text` | Optional; max 255 chars | Hero Subtitle / Role Tag | `profiles.headline` | `headline` | Persisted in `profiles` | Embedded in published snapshot | ✅ Verified |
| 4 | **Bio / Company About** | Both (`personal`, `business`) | `Identity & Card` / `Company Info` | `bio` | `textarea` (3 rows) | Optional; multi-line text | About / Executive Bio Section | `profiles.bio` | `bio` | Persisted in `profiles` | Embedded in published snapshot | ✅ Verified |
| 5 | **Avatar / Logo URL** | Both (`personal`, `business`) | `Identity & Card` / `Company Info` | `avatarUrl` | `text` / `url` | Optional; valid HTTP/HTTPS URL | Circular/Squircle Avatar Hero | `profiles.avatar_url` | `avatarUrl` | Persisted in `profiles` | Embedded; fallback to dynamic initials if empty | ✅ Verified |
| 6 | **Cover Banner URL** | Both (`personal`, `business`) | `Identity & Card` / `Company Info` | `coverUrl` | `text` / `url` | Optional; valid HTTP/HTTPS URL | Top Cover / Backdrop Banner | `profiles.cover_url` | `coverUrl` | Persisted in `profiles` | Embedded; fallback to luxury gradient if empty | ✅ Verified |
| 7 | **Direct Phone Number** | Both (`personal`, `business`) | `Identity & Card` / `Company Info` | `phone` | `tel` | Optional; sanitized international phone format | Call CTA Pill & Direct Contact Row | `profiles.phone` | `phone` | Persisted in `profiles` | Generates `tel:` action href | ✅ Verified |
| 8 | **WhatsApp Direct Number** | Both (`personal`, `business`) | `Identity & Card` / `Company Info` | `whatsapp` | `tel` | Optional; sanitized international phone format | WhatsApp Row & Message Action | `profiles.whatsapp` | `whatsapp` | Persisted in `profiles` | Generates `https://wa.me/<digits>` action href | ✅ Verified |
| 9 | **Business Email Address** | Both (`personal`, `business`) | `Identity & Card` / `Company Info` | `email` | `email` | Optional; RFC 5322 email format | Email Row & Quick Mail CTA | `profiles.email` | `email` | Persisted in `profiles` | Generates `mailto:<email>` action href | ✅ Verified |
| 10 | **Official Website URL** | Both (`personal`, `business`) | `Identity & Card` / `Company Info` | `website` | `url` | Optional; valid web URL | Website Row & External Link CTA | `profiles.website` | `website` | Persisted in `profiles` | Generates external verified link with `target="_blank"` | ✅ Verified |
| 11 | **Office / Physical Address** | Both (`personal`, `business`) | `Identity & Card` / `Company Info` | `address` | `text` | Optional; plain text address | Address Section & Map Directions | `profiles.address` | `address` | Persisted in `profiles` | Generates Google Maps search direction query | ✅ Verified |
| 12 | **Location / City** | Business (`business`) | `Identity & Card` / `Company Info` | `location` | `text` | Optional; city/state/country | Location metadata header | `profiles.location` | `location` | Persisted in `profiles` | Schema.org location address | ✅ Verified |
| 13 | **Social Platform** | Both (`personal`, `business`) | `Social Channels` | `socialLinks[i].platform` | `select` | Enum (`instagram`, `linkedin`, `twitter`, `youtube`, `facebook`, `github`, etc.) | Platform Icon & Branded Badge | `profiles.social_links` (JSONB) | `socialLinks` | Persisted as structured array | Renders verified SVG vector icon | ✅ Verified |
| 14 | **Social URL** | Both (`personal`, `business`) | `Social Channels` | `socialLinks[i].url` | `url` | Required per link; normalized URL | Clickable Social Link Tile | `profiles.social_links` (JSONB) | `socialLinks` | Persisted as structured array | Sanitized external navigation | ✅ Verified |
| 15 | **Company / Venture Name** | Business (`business`) | `Companies & Locations` | `businesses[i].companyName` | `text` | Required per venture; non-empty | Venture Card Header | `profile_businesses.name` | `businesses` | Persisted in child table | Renders multi-company group card | ✅ Verified |
| 16 | **Company Role / Designation** | Business (`business`) | `Companies & Locations` | `businesses[i].jobTitle` | `text` | Optional role title | Venture Subtitle / Designation | `profile_businesses.tagline` | `businesses` | Persisted in child table | Rendered alongside venture | ✅ Verified |
| 17 | **Company Website URL** | Business (`business`) | `Companies & Locations` | `businesses[i].businessWebsite` | `url` | Optional web URL | Venture External Website Link | `profile_businesses.website` | `businesses` | Persisted in child table | Clickable venture link | ✅ Verified |
| 18 | **Company Location / Address** | Business (`business`) | `Companies & Locations` | `businesses[i].businessAddress` | `text` | Optional geographic location | Venture Location Row | `profile_businesses.address` | `businesses` | Persisted in child table | Geo marker display | ✅ Verified |
| 19 | **Product / Service Title** | Business (`business`) | `Products & Services` | `catalogue[i].title` | `text` | Required per item; non-empty | Offering Item Title | `profile_catalogue_items.title` | `catalogue` | Persisted in child table | Rendered in grid/list | ✅ Verified |
| 20 | **Product Type / Offering Kind** | Business (`business`) | `Products & Services` | `catalogue[i].type` | `select` | Enum (`product`, `service`) | Category Pill / Tag | `profile_catalogue_items.type` | `catalogue` | Persisted in child table | Adapts CTA & badge styling | ✅ Verified |
| 21 | **Price & Currency** | Business (`business`) | `Products & Services` | `catalogue[i].price` | `text` | Optional formatted price string (e.g. `₹2,999`) | Price Tag Badge | `profile_catalogue_items.price` | `catalogue` | Persisted in child table | Non-overlapping price tag | ✅ Verified |
| 22 | **Product Description** | Business (`business`) | `Products & Services` | `catalogue[i].description` | `textarea` | Optional brief summary | Product Card Body Text | `profile_catalogue_items.description` | `catalogue` | Persisted in child table | Line-clamped descriptive prose | ✅ Verified |
| 23 | **Product Action / CTA URL** | Business (`business`) | `Products & Services` | `catalogue[i].actionUrl` | `url` | Optional web link | Enquire / View Details CTA | `profile_catalogue_items.action_url` | `catalogue` | Persisted in child table | Action button href | ✅ Verified |
| 24 | **Product Action CTA Label** | Business (`business`) | `Products & Services` | `catalogue[i].actionLabel` | `text` | Default: `Enquire` | CTA Button Text | `profile_catalogue_items.action_label` | `catalogue` | Persisted in child table | Action button label | ✅ Verified |
| 25 | **Custom Meta Title** | Both (`personal`, `business`) | `SEO & Cards` | `seoTitle` | `text` | Max 60 chars; inherits display name if empty | Google Snippet & Open Graph Title | `profiles.custom_fields.seo.title` | `customFields.seo.title` | Persisted in JSONB `custom_fields` | `<title>` & `<meta property="og:title">` | ✅ Verified |
| 26 | **Custom Meta Description** | Both (`personal`, `business`) | `SEO & Cards` | `seoDescription` | `textarea` | Max 160 chars; inherits bio if empty | Google Snippet & Open Graph Desc | `profiles.custom_fields.seo.description` | `customFields.seo.description` | Persisted in JSONB `custom_fields` | `<meta name="description">` & `<meta property="og:description">` | ✅ Verified |
| 27 | **Visual Template ID** | Both (`personal`, `business`) | `Theme & Style` | `templateId` | `grid select` | One of 13 standard template identifiers | Complete Theme Architecture & Styling | `profiles.template_id`, `profiles.theme_id` | `templateId`, `themeId` | Persisted; mapped through `canonicalTemplateId()` | Drives master layout component | ✅ Verified |
| 28 | **Theme Palette Tokens** | Both (`personal`, `business`) | `Theme & Style` | `themeColors` | `color` (10 tokens) | 10 HEX/RGB color tokens | Scoped CSS variables (`--user-*`) | `profiles.theme_config` | `themeConfig` | Persisted; cached per-theme in memory | Injected as scoped CSS tokens | ✅ Verified |

---

## 3. Discrepancies Discovered & Repaired During Audit

1. **`profileType` Update Drop in Backend**:
   - *Issue*: `ProfilesService.update()` did not include `profileType` in its Drizzle `.set()` statement, meaning switching from Personal to Business was dropped on subsequent saves.
   - *Fix*: Added `profileType: data.profileType !== undefined ? data.profileType : existing.profileType` to `ProfilesService.update()`.

2. **`location` Field Dropped**:
   - *Issue*: `profiles.location` existed in the Postgres schema, but neither `ProfilesService.create()` nor `update()` mapped it.
   - *Fix*: Added `location` to both `create()` and `update()`, and included `location` in `PublicProfileSnapshot`.

3. **`slug` Immutability / Collision Handling**:
   - *Issue*: If a user updated their handle in the studio, the backend `update()` ignored `data.slug`.
   - *Fix*: Implemented slug validation, reserved-name check, and collision detection (`ne(schema.profiles.id, profileId)`), updating `profiles.slug` and invalidating both old and new Redis cache entries.

4. **Public Profile Parity Gap**:
   - *Issue*: `PublicProfilePage.tsx` was not passing `socialLinks`, `profileType`, `location`, or catalogue `type`/`actionLabel` into `<ProfileRenderer>`.
   - *Fix*: Fully populated `renderData` in `PublicProfilePage.tsx` with all fields, matching `livePreviewData` 100%.

5. **Draft Restoration Aliases**:
   - *Issue*: `schema.profileBusinesses` returned `name`, `tagline`, `website`, `address`, but the editor input controls expected `companyName`, `jobTitle`, `businessWebsite`, `businessAddress`.
   - *Fix*: Implemented bidirectional normalization in both `ProfilesService.findOne()` and `BuilderPage.tsx` `useEffect`.
