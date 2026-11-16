# Taptch Profile Studio — Live Preview Field Mapping Specification

## 1. Architectural Model
The live preview in the **Taptch Profile Studio** (`/builder/new` and `/builder/:profileId`) operates on an immediate reactive state pipeline:

$$\text{User Keystroke} \longrightarrow \text{React Controlled State} \longrightarrow \text{livePreviewData Memo} \longrightarrow \text{ProfileRenderer (Keyed)} \longrightarrow \text{DOM Refresh (<16ms)}$$

No manual reload, network roundtrip, or "Save Draft" operation is required for changes to appear in the live simulator.

---

## 2. Exhaustive Field-to-Preview Destination Mapping

| Editor Input Field | Studio State Binding | Live Preview Target Component | Live Preview Visual Destination | Live Interactive Action / Click Behavior |
|---|---|---|---|---|
| **Full Display Name** | `displayName` | Hero Component (`HeroSection`) | Profile Header Name (`<h1>` / `<h2>`) & Fallback Initials Avatar | Text update; updates Google search result title |
| **Public Card Handle / Slug** | `slug` | Studio Header & Preview URL Badge | Top Subtitle (`/{slug}`) & Google snippet URL | Click opens published route in new tab; updates QR target |
| **Professional Headline / Role** | `headline` | Hero Component (`HeroSection`) | Subtitle tag / corporate badge directly below name | Text update; updates search result snippet |
| **Bio / About Me** | `bio` | Bio Component (`BioSection`) | Narrative biography text block | Formatted paragraphs; line-clamp fallback |
| **Profile Avatar Image URL** | `avatarUrl` | Hero Component (`HeroSection`) | Circular/squircle profile photo | Smooth image load; fallback to gold luxury monogram avatar |
| **Cover Banner Image URL** | `coverUrl` | Cover Component (`CoverBanner`) | Top edge-to-edge banner background | Hardware-accelerated image cover; fallback to theme gradient |
| **Direct Phone Number** | `phone` | `DirectContactSection` | Phone row with `[ TEL ]` icon & sanitized digits | Click launches native mobile dialer (`tel:+91...`) |
| **WhatsApp Direct Number** | `whatsapp` | `DirectContactSection` | WhatsApp branded row with official SVG icon | Click opens WhatsApp Web / mobile chat (`https://wa.me/...`) |
| **Business Email Address** | `email` | `DirectContactSection` | Email row with `[ MAIL ]` icon & recipient address | Click launches mail client (`mailto:...`) |
| **Official Website URL** | `website` | `DirectContactSection` | Website row with globe icon & formatted hostname | Click navigates externally with `rel="noreferrer"` |
| **Office / Physical Address** | `address` | `DirectContactSection` | Location row with pin icon & physical address text | Click launches Google Maps navigation query |
| **Social Platform Picker** | `socialLinks[i].platform` | `SocialLinksSection` | Branded platform vector icon (Instagram, LinkedIn, X, etc.) | Renders platform-calibrated SVG badge |
| **Social Channel URL** | `socialLinks[i].url` | `SocialLinksSection` | Interactive social button tile | Click opens verified social profile in new tab |
| **Company / Venture Name** | `businesses[i].companyName` | `VenturesSection` | Commercial venture card title | Expands venture details card |
| **Company Role / Designation** | `businesses[i].jobTitle` | `VenturesSection` | Venture card designation badge | Renders leadership role alongside venture |
| **Company Website URL** | `businesses[i].businessWebsite` | `VenturesSection` | Venture external link button | Click navigates to corporate subsidiary URL |
| **Company Address / Location** | `businesses[i].businessAddress` | `VenturesSection` | Venture geographical address row | Displays office location with map pin |
| **Product / Service Title** | `catalogue[i].title` | `CatalogueSection` | Product card heading | Product title with non-overlapping typography |
| **Product Offering Type** | `catalogue[i].type` | `CatalogueSection` | Pill badge: `Product` vs `Service` | Adapts card styling and CTA framing |
| **Product Price** | `catalogue[i].price` | `CatalogueSection` | High-contrast price badge (e.g. `₹2,999`) | Renders currency formatted tag |
| **Product Description** | `catalogue[i].description` | `CatalogueSection` | Card descriptive body copy | Line-clamped readable description |
| **Product Action URL** | `catalogue[i].actionUrl` | `CatalogueSection` | Primary product CTA button | Click redirects to enquiry or checkout page |
| **Product Action Label** | `catalogue[i].actionLabel` | `CatalogueSection` | CTA Button Text (default: `Enquire`) | Custom action label on button |
| **Custom Meta Title** | `seoTitle` | `SEO Studio Mockup` | Google Search Result & WhatsApp card title | Live preview updates character counter (x/60) & snippet |
| **Custom Meta Description** | `seoDescription` | `SEO Studio Mockup` | Google Search snippet & WhatsApp card description | Live preview updates character counter (x/160) & snippet |
| **Theme Selection** | `templateId` | `ProfileRenderer` | Entire layout architecture, fonts, and layout grid | Key-based complete re-mount across all 13 themes |
| **Theme Palette Swatches** | `themeColors` | `ProfileRenderer` Container | Scoped CSS variables (`--user-*`) | Immediate palette re-coloring across buttons, borders, and cards |

---

## 3. Real-Time Synchronization Architecture Rules

1. **Zero Keystroke Trimming**:
   - `onChange` handlers store raw user input without calling `.trim()`. This guarantees Backspace, Delete, Select All, and multi-word typing with spaces function smoothly without cursor jumping.
   - Trimming and sanitization are applied exclusively during payload submission and search preview compilation.

2. **Conditional Row Rendering**:
   - Contact rows are only rendered if their respective sanitized value is non-empty. An empty phone number does not render a broken or blank row.
   - Incomplete numbers remain fully visible and editable in the form without vanishing from state.

3. **Immutable Dynamic Array Modifications**:
   - Adding, editing, or removing items in `socialLinks`, `businesses`, and `catalogue` uses immutable `.map()` and `.filter()` operations with stable unique `id` keys.
   - Deleting an item removes it from the live preview immediately without requiring a save.
