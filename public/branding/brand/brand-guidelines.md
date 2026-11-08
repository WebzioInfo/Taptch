# TAPTCH Brand Identity & Design System Guidelines

**Version:** 2.0.0  
**Status:** Approved & Implemented  
**Date:** November 2026  
**Classification:** Official Brand Manual  

---

## 1. Executive Summary & Brand Purpose

**TAPTCH** is an intelligent digital identity and smart networking ecosystem engineered for executives, founders, enterprises, and high-growth professionals. The platform bridges physical presence with persistent digital connection through contactless 13.56 MHz NFC hardware, dynamic dual-layer QR vectors, and high-performance digital identity profiles.

The brand identity represents:
- **Instantaneous Connection:** Frictionless tap-and-connect interaction.
- **Architectural Permanence:** Structural reliability, privacy-first engineering, and zero data friction.
- **Obsidian Luxury:** An uncompromising aesthetic of dark matte obsidian, brushed champagne gold, and laser-precise typography.

---

## 2. Logo Concept & Symbol Geometry

The TAPTCH mark—the **Harmonic Nexus T**—is mathematically constructed on an 8-point geometric grid:

```
          ▲  [Apex Transmission Core / Direct Tap]
      ╭───────╮
    ─╯  / | \  ╰─  [Reciprocal Wave Wings / 13.56 MHz NFC Field]
       /  |  \
         [|]      [Architectural Identity Pillar]
         [|]
         [|]
```

### Visual Anatomy:
1. **The Architectural Pillar (Vertical Stem):**  
   Anchors the symbol, representing the foundational, persistent digital identity profile of the individual or enterprise.
2. **The Reciprocal Wave Wings (Dual Chevron Crossbar):**  
   Curved dynamic arcs that mirror the electromagnetic radiation pattern of a near-field communication (NFC) antenna loop, representing dual-directional contact exchange.
3. **The Apex Transmission Core (Diamond Center):**  
   The geometric center point symbolizing the exact moment of physical tap-to-digital activation.

---

## 3. Brand Color Palette

### 3.1 Primary Luxury Palette

| Color Name | Hex Code | HSL / RGB | Usage |
| :--- | :--- | :--- | :--- |
| **Deep Obsidian** | `#0A0A0C` | `240, 14%, 4%` / `rgb(10, 10, 12)` | Primary dark canvas, card bodies, hero backdrops |
| **Matte Charcoal** | `#121216` | `240, 10%, 8%` / `rgb(18, 18, 22)` | Surface cards, floating navigation, modal panels |
| **Obsidian Slate** | `#18181D` | `240, 9%, 10%` / `rgb(24, 24, 29)` | Hover states, elevated surfaces, input frames |
| **Champagne Gold** | `#D4AF37` | `46, 65%, 52%` / `rgb(212, 175, 55)` | Primary brand accent, insignia symbol, key CTA buttons |
| **Brushed Gold** | `#F3E5AB` | `48, 77%, 81%` / `rgb(243, 229, 171)` | Metallic highlight reflections, gradient end-stops |
| **Platinum Pure** | `#FFFFFF` | `0, 0%, 100%` / `rgb(255, 255, 255)` | Wordmark typography, high-contrast headers |

### 3.2 Accent & Semantic Tokens

| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **Electric Cyan** | `#38BDF8` | Digital connectivity accents, active link pulses |
| **Emerald Verified** | `#10B981` | NFC activation success, enterprise verification badges |
| **Subtle Divider** | `rgba(255,255,255,0.08)` | Micro-borders, card outlines, tabular dividers |

---

## 4. Typography

### 4.1 Wordmark Specifications
The **TAPTCH** wordmark is engineered with wide geometric letter-spacing (`letter-spacing: 0.18em`) and high-tension modern sans-serif geometry:
- **Font Stack:** 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Weight:** 900 (ExtraBold)
- **Tracking:** +180 (`tracking-[0.18em]`)
- **Casing:** 100% Uppercase: **TAPTCH**

### 4.2 UI & Body Typography
- **Headings:** Plus Jakarta Sans / Outfit, SemiBold to ExtraBold (weights 600–800)
- **Body:** Plus Jakarta Sans / Inter, Regular & Medium (weights 400 & 500)
- **Data & Serial IDs:** JetBrains Mono or monospace (weight 500)

---

## 5. Logo Variations & Asset Catalog

The asset package is organized in `public/branding/`:

```
public/branding/
├── logo/
│   ├── taptch-logo-primary.svg     # Symbol + Wordmark (Dark canvas optimized)
│   ├── taptch-logo-light.svg       # Symbol + Wordmark (Optimized for dark backgrounds)
│   ├── taptch-logo-dark.svg        # Symbol + Wordmark (Optimized for light backgrounds)
│   ├── taptch-logo-horizontal.svg  # Compact navbar lockup
│   ├── taptch-logo-stacked.svg     # Centered vertical lockup for splash / cards
│   ├── taptch-symbol.svg           # Standalone iconic mark
│   └── taptch-monochrome.svg       # 1-Color vector for physical engraving
└── icons/
    ├── favicon.svg                  # Vector browser favicon
    ├── icon-192.png                 # PWA and mobile home-screen icon (192x192)
    ├── icon-512.png                 # High-resolution splash icon (512x512)
    └── apple-touch-icon.png         # iOS home screen web-clip icon (180x180)
```

---

## 6. Sizing, Clear Space & Alignment

### 6.1 Clear Space
To preserve visual authority and impact, maintain a clear space zone around the logo equal to the height of the symbol's apex triangle (**X**).
No typography, photography, borders, or graphics may encroach within this boundary.

### 6.2 Minimum Sizes
- **Primary / Horizontal Lockup:**
  - Digital: Minimum width **120px** (height ~24px)
  - Print / Physical: Minimum width **28mm**
- **Standalone Symbol:**
  - Digital: Minimum size **16x16px** (favicon / micro badge)
  - Physical: Minimum size **6x6mm** (microchip indicator)
- **Stacked Lockup:**
  - Digital: Minimum width **80px**
  - Physical: Minimum width **20mm**

---

## 7. Light & Dark Background Usage

1. **Dark Backgrounds (`#000000` to `#1E1E24`):**
   - **Recommended:** `taptch-logo-primary.svg` or `taptch-logo-light.svg`
   - The symbol displays the metallic Champagne Gold gradient (`#D4AF37` to `#F3E5AB`), while the wordmark renders in crisp Platinum Pure (`#FFFFFF`).
2. **Light Backgrounds (`#FFFFFF` to `#F3F4F6`):**
   - **Recommended:** `taptch-logo-dark.svg`
   - The symbol retains rich Champagne Gold, and the wordmark renders in deep Charcoal Ink (`#0A0A0C`).
3. **High-Contrast Monochrome & Engraving:**
   - **Recommended:** `taptch-monochrome.svg`
   - Applied in 100% white on dark card stock, or 100% black on white invoice/shipping stationery.

---

## 8. Physical NFC Card Application

### 8.1 Matte Black PVC Card
- **Front:** Standalone `taptch-symbol.svg` centered or lower-right corner, hot-stamped in brushed metallic gold foil or subtle gloss UV spot finish.
- **Back:** Dynamic QR vector with center TAPTCH micro-badge, card serial number in laser-etched monochrome.

### 8.2 Anodized Matte Black Stainless Steel / Metal Card
- **Laser Engraving:** Use `taptch-monochrome.svg`.
- The laser exposes the raw silvery steel base under the anodized black coat with 0.1mm line precision.

### 8.3 Bamboo / Walnut Wood Cards
- **Laser Pyrography:** `taptch-monochrome.svg` vector depth-etched at 0.3mm into the natural grain.

---

## 9. Incorrect Usage (Strictly Prohibited)

- ❌ **Do not** stretch, distort, or skew the logo's aspect ratio.
- ❌ **Do not** alter the individual positions or geometry of the wave wings or pillar.
- ❌ **Do not** recolor the symbol with unapproved neon or pastel gradients.
- ❌ **Do not** place the logo on low-contrast, visually noisy backgrounds without a scrim or container.
- ❌ **Do not** append unofficial taglines or descriptors directly into the SVG vector files.
- ❌ **Do not** hardcode the brand name as a raw string literal in application UI code (always import `brandConfig.name`).

---

## 10. Developer Component Integration

In Next.js components, render the brand logo using the centralized `<BrandLogo />` component:

```tsx
import { BrandLogo } from '@/components/brand';

// Navbar horizontal lockup
<BrandLogo variant="horizontal" size="md" asLink href="/" />

// Standalone symbol for avatar badge or collapsed sidebar
<BrandLogo variant="symbol" size="sm" />

// Auth page centered stacked logo
<BrandLogo variant="stacked" size="lg" />

// Light theme explicit override
<BrandLogo variant="primary" theme="light" size="lg" />
```

