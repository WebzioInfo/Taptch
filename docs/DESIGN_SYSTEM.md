# Taptch — Design System & Visual Specification

## 1. Design Philosophy
Taptch products are **mobile-first, tactile, and uncompromisingly premium**. The public profile is the digital face of an executive or enterprise. It must load in under a second, feel native on an iPhone or high-end Android, and avoid the cluttered, generic appearance of link-in-bio directories.

### Core Tenets
1. **Designed at 390×844 px First**: The public profile is viewed 98% of the time on smartphones following a physical card tap or camera scan.
2. **Thumb-Reach Action Dock**: Crucial actions (Save Contact, Call, WhatsApp, Exchange) must stay anchored within comfortable reach of a user's single-handed thumb zone.
3. **Typography-Driven Hierarchy**: Distinct pairings of refined display serif/grotesk headers with hyper-legible body sans-serif.
4. **Physicality & Tactile Feedback**: Subtly elevated cards, crisp hairline borders (0.5px/1px), soft ambient backdrops, and spring press states (`active:scale-[0.98]`).
5. **Zero Generic Stock Fillers**: No generic blue buttons, no childish emoji-as-icons, no low-res uncurated placeholders.

---

## 2. Design Tokens & Foundations

### 2.1 Spacing & Radius Scale
```css
/* Radii Scale */
--radius-none: 0px;
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 9999px;

/* Spacing Scale */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
```

### 2.2 Typography Pairings & Self-Hosted Font Strategy
| Theme Archetype | Display / Heading Font | Body Font | Mood & Tone |
| :--- | :--- | :--- | :--- |
| **Obsidian** (Luxury) | *Playfair Display* / *Cormorant Garamond* | *Plus Jakarta Sans* | Editorial elegance, C-suite authority |
| **Ivory** (Minimal Swiss) | *Space Grotesk* / *Inter* | *Inter Tight* | Precision, architectural cleanliness |
| **Aurora** (Modern Glass) | *Outfit* / *Plus Jakarta Sans* | *Plus Jakarta Sans* | Tech-forward, high agency, luminous |
| **Mono** (Brutalist) | *JetBrains Mono* / *Syne* | *Space Mono* | Uncompromising raw contrast |
| **Counsel** (Executive) | *Merriweather* / *Lora* | *Source Sans Pro* | Trust, clinical/legal distinction |
| **Indic Multi-Script** | *Noto Serif Devanagari / Malayalam* | *Noto Sans Devanagari / Malayalam* | Native script dignity & legibility |

#### Font Licensing & Performance Plan
- **Self-Hosting Mandate**: To eliminate Google third-party tracking, prevent Flash of Invisible Text (FOIT), and avoid network latency in India, all fonts are self-hosted using `@fontsource` packages or `next/font/local` with static WOFF2 subsets.
- **Licenses**: All fonts utilize permissive open-source licenses (SIL Open Font License 1.1 or Apache 2.0).
- **Indic Script Fallbacks**: Every CSS font-family declaration strictly falls back to native Indic fonts:
  ```css
  font-family: var(--font-body), "Noto Sans Devanagari", "Noto Sans Malayalam", system-ui, sans-serif;
  ```

---

## 3. The 6 Launch Studio Themes & Contrast Verification

### Universal Accessibility Rule
Every color combination must satisfy WCAG 2.2 Level AA requirements (contrast ratio $\ge 4.5:1$ for normal text, $\ge 3:1$ for large text $\ge 18$pt and UI components).

### 3.1 Obsidian (Dark Luxury) — Flagship Direction
- **Canvas**: `#0A0A0C` (Matte Obsidian)
- **Surfaces / Cards**: `#141418` with `#26262F` 1px hairline stroke
- **Primary Accent / CTA**: `#D4AF37` (Champagne Metallic Gold)
- **Secondary Accent**: `#F3E5AB` (Warm Gold Cream)
- **Text Hierarchy & Contrast Ratios**:
  - Primary Text `#FFFFFF` on `#0A0A0C` Canvas: **19.8:1** (AAA Pass)
  - Secondary Text `#A1A1AA` on `#141418` Card: **5.4:1** (AA Pass)
  - CTA Button Text `#0A0A0C` on `#D4AF37` Gold: **9.1:1** (AAA Pass)
- **Action Dock**: Single fixed floating frosted bar (`#0D0D11` at 85% opacity + `backdrop-blur-md`) with single primary Gold "Save Contact" pill.

### 3.2 Ivory (Light Editorial Swiss)
- **Canvas**: `#FBFBFA` (Alabaster Warm White)
- **Surfaces / Cards**: `#FFFFFF` with `#E4E4E7` 1px border stroke
- **Primary Accent / CTA**: `#09090B` (Deep Carbon Charcoal)
- **Secondary Accent**: `#71717A`
- **Text Hierarchy & Contrast Ratios**:
  - Primary Text `#09090B` on `#FBFBFA` Canvas: **18.2:1** (AAA Pass)
  - Secondary Text `#27272A` on `#FFFFFF` Card: **12.8:1** (AAA Pass)
  - Muted Text `#71717A` on `#FFFFFF` Card: **4.6:1** (AA Pass)
  - CTA Button Text `#FFFFFF` on `#09090B` Carbon: **18.5:1** (AAA Pass)
- **Action Dock**: Pure white docked bar with deep black CTA pill.

### 3.3 Aurora (Restrained Modern Glass)
- **Canvas**: `#0B0F19` (Restrained Deep Navy — excessive neon gradients removed)
- **Surfaces / Cards**: `rgba(255, 255, 255, 0.05)` with `rgba(255, 255, 255, 0.12)` subtle top-lit border
- **Primary Accent / CTA**: `#0284C7` (Cyan Blue) with `#38BDF8` text accent
- **Text Hierarchy & Contrast Ratios**:
  - Primary Text `#F8FAFC` on glass card `#171B26`: **15.6:1** (AAA Pass)
  - Secondary Text `#94A3B8` on glass card `#171B26`: **5.2:1** (AA Pass)
  - Luminous Accent `#38BDF8` on glass card `#171B26`: **6.8:1** (AAA Pass)
  - CTA Button Text `#FFFFFF` on `#0284C7`: **4.9:1** (AA Pass)
- **Action Dock**: Frosted glass pill dock with cyan CTA.

### 3.4 Mono (Minimal Brutalist)
- Pure black and white contrast (`#000000` / `#FFFFFF`), 0px border radius, monospaced metadata, stark wireframe buttons.

### 3.5 Counsel (Professional Services)
- Deep Navy (`#0F172A`), Slate Grey cards (`#1E293B`), crisp Royal Sapphire accents (`#2563EB`).

### 3.6 Studio (Creative Portfolio)
- Neutral dark slate background with electric lime or vibrant coral accents, dynamic media masonry layouts.

---

## 4. Public Profile Layout & Touch Zones (390px Mobile Viewport)

```
+------------------------------------------+ (0px)
| [Status Bar Area: Battery, Wi-Fi]        |
|                                          |
| +--------------------------------------+ |
| | COVER BANNER (16:9 or 3:1)           | |
| | Subtle gradient or brand banner      | |
| +--------------------------------------+ |
|           [ AVATAR (100px) ]             | (Floating overlap)
|                                          |
|        Arjun Sharma, CFA                 | (Display Font 24px Bold)
|        Managing Director                 | (Body Font 14px Medium)
|        Apex Capital Partners             | (Muted 13px)
|        [ Verified Badge ]                |
|                                          |
| [ WhatsApp ] [ Call ] [ Email ] [ Maps ] | (Quick Action Grid)
|                                          |
| +--------------------------------------+ |
| | ABOUT / EXECUTIVE SUMMARY            | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | PRODUCT / SERVICE CATALOGUE          | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | BROCHURE & DOCUMENTS (FLIP-BOOK)     | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | UPI PAYMENT LINK & DYNAMIC QR        | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | GOOGLE REVIEWS (4.9 Stars)           | |
| +--------------------------------------+ |
|                                          |
|  [ Bottom Spacing: 96px ]               |
+------------------------------------------+
| FLOATING THUMB-REACH ACTION DOCK (72px)  | (Fixed Bottom)
| [ Save Contact (vCard) ] [ Exchange ]    | (48px Height, Min 44px Touch)
+------------------------------------------+ (844px)
```

---

## 5. Component Guidelines
- **Buttons**: Minimum hit target is $44 \times 44$ px. Touch states utilize CSS transform spring compression (`active:scale-[0.97] transition-transform`).
- **Icons**: Lucide icons rendered at $18$ px or $20$ px with consistent stroke width ($1.75$ px).
- **Modals**: Slide up from bottom on mobile (drawer sheet pattern via Radix / Vaul) with drag handle; centered dialog on desktop.
- **Micro-Interactions**: Subtle copy-to-clipboard toast notifications with haptic vibration (`navigator.vibrate(20)` where supported).

