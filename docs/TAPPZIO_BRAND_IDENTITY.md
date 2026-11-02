# Architectural Record: Tappzio Brand Identity & Logo System

## 1. Overview & Architectural Intent
This document records the design rationale, mathematical construction, asset hierarchy, and code integration of the official **Tappzio** brand identity.

Per Tappzio architecture rules:
1. **Zero Brand Literals:** Never hardcode the brand name into application UI components. All user-facing brand labels, asset URLs, and color codes are strictly derived from `@/config/brand` (`brandConfig`).
2. **Unified Component Governance:** All logo instances are rendered through the centralized `<BrandLogo />` component located in `src/components/brand/BrandLogo.tsx`.
3. **Scalable Vector Standards:** All master brand marks are crafted as clean, un-bloated SVGs with balanced viewBox definitions, ensuring zero pixelation on ultra-high-density retina displays or physical CNC/laser engraving processes.

---

## 2. The Harmonic Nexus Mark

### Conceptual Philosophy
The symbol synthesizes three core technical and brand attributes:
1. **The Letter T:** Primary brand glyph for Tappzio.
2. **The 13.56 MHz NFC Waveform:** Dual symmetrical wave wings curving outward from the stem, visualizing near-field electromagnetic inductive coupling.
3. **The Architectural Pillar:** A solid vertical foundation representing persistent digital identity, multi-business association, and enterprise reliability.
4. **The Apex Diamond:** The focal contact point symbolizing instantaneous tap-and-connect interaction.

---

## 3. Physical Asset Directory Structure

```
public/
├── branding/
│   ├── logo/
│   │   ├── tappzio-logo-primary.svg     (460x100, Metallic Champagne Gold & Platinum)
│   │   ├── tappzio-logo-light.svg       (460x100, For dark backdrops)
│   │   ├── tappzio-logo-dark.svg        (460x100, For light backdrops)
│   │   ├── tappzio-logo-horizontal.svg  (380x72, Slim navbar lockup)
│   │   ├── tappzio-logo-stacked.svg     (240x180, Vertical card/modal lockup)
│   │   ├── tappzio-symbol.svg           (100x100, Standalone glyph)
│   │   └── tappzio-monochrome.svg       (460x100, 1-color vector for CNC/laser)
│   ├── icons/
│   │   ├── favicon.svg                  (Vector browser tab icon)
│   │   ├── icon-192.png                 (192x192 rasterized PWA icon)
│   │   ├── icon-512.png                 (512x512 rasterized high-res icon)
│   │   └── apple-touch-icon.png         (180x180 iOS webclip icon)
│   └── brand/
│       └── brand-guidelines.md          (Full graphic design manual)
├── favicon.svg
├── favicon.ico
└── apple-touch-icon.png
```

---

## 4. Integration Checkpoints

- **Landing Page (`src/app/page.tsx`):** Navbar uses `<BrandLogo variant="horizontal" size="md" asLink href="/" />`. Footer uses `<BrandLogo variant="symbol" size="sm" />`.
- **App Layout (`src/app/(app)/layout.tsx`):** Header brand slot uses `<BrandLogo variant="horizontal" size="md" asLink href="/dashboard" />`.
- **Auth Shells (`src/app/(auth)/login/`, `register/`, `verify/`):** Hero cards display `<BrandLogo variant="symbol" size="xl" asLink href="/" />`.
- **Executive Admin Cockpit (`src/app/(admin)/admin/page.tsx`):** Displays `<BrandLogo variant="symbol" size="md" />` next to the Admin Control badge.
- **Dynamic Digital Profile QR Modal (`src/components/templates/ProfileRenderer.tsx`):** The QR frame center features a high-contrast badge rendering `<BrandLogo variant="symbol" size="sm" />`.
- **Root Metadata (`src/app/layout.tsx`):** Houses dynamic OpenGraph tags, SVG favicons, and Apple Touch Icon pointers.

