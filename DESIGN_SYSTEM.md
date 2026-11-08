# Instagram NFC Card Campaign — Design System Specification

## 1. Executive Summary & Design Vision
The Instagram NFC Card Campaign design system embodies the minimalist, product-first design principles of Apple, Linear, and Stripe. The physical NFC card is the singular hero. The interface eliminates unnecessary decorative fluff, AI-template clichés, and redundant containers in favor of deliberate whitespace, crisp typography, and photorealistic product representations.

---

## 2. Brand Color Tokens

| Token Name | Hex Code | Purpose & Application |
|---|---|---|
| **Primary Blue** | `#2563EB` | Primary CTA buttons, active selection rings, active highlights, key links |
| **Deep Blue** | `#1D4ED8` | Hover and active interactive states for primary buttons |
| **Obsidian Black** | `#111827` | Primary display headlines, text hierarchy, dark mode containers |
| **Pure White** | `#FFFFFF` | Dominant page background, card faces, high-contrast badges |
| **Soft Background** | `#F8FAFC` | Secondary surfaces, editorial section backgrounds, form inputs |
| **Border Divider** | `#E5E7EB` | Subtle, crisp separation lines and input borders |
| **Muted Secondary** | `#64748B` | Secondary body text, captions, microcopy, specifications |

---

## 3. Typography Scale & Hierarchy

All typography uses **Inter** (with system fallback stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`).

| Element | Weight | Size (Mobile / Desktop) | Line Height | Tracking | Color |
|---|---|---|---|---|---|
| **Hero Headline (H1)** | Extrabold (800) | 36px / 72px | 1.08 | `-0.03em` | `#111827` |
| **Section Title (H2)** | Extrabold (800) | 28px / 36px | 1.15 | `-0.025em` | `#111827` |
| **Product Title (H3)** | Bold (700) | 20px / 24px | 1.2 | `-0.02em` | `#111827` |
| **Numbered Steps (01-03)** | Extrabold (800) | 32px / 40px | 1.0 | `-0.04em` | `#2563EB` |
| **Body Primary** | Normal (400) | 14px / 16px | 1.5 | `normal` | `#64748B` |
| **Captions / Microtext** | Medium (500) | 10px / 11px | 1.4 | `0.05em` | `#64748B` |

---

## 4. Physical Card Geometry & Component Metrics

### Standard CR80 Physical Dimensions
- **Physical Ratio:** 85.60 mm × 53.98 mm (`aspect-[85.6/53.98]`, ~1.5858).
- **Corner Radius:** 3.18 mm physical radius rendered as `rounded-2xl` (~16px).
- **Core Thickness:** 0.76 mm standard credit card thickness.

### Material Implementations
1. **Matte Obsidian PVC:**
   - Base: `#0A0A0C`
   - Finish: Velvet matte texture with radial ambient glare overlay (`radial-gradient(ellipse at top left, rgba(255, 255, 255, 0.08) 0%, transparent 55%)`).
   - Accents: Brushed metallic blue foil monogram, pure white laser-sharp typography.
2. **Pure White Minimal:**
   - Base: `#FFFFFF`
   - Finish: Crisp architectural ceramic white, subtle perimeter shadow (`ring-1 ring-black/5`).
   - Accents: Deep obsidian typography (`#111827`), blue accent badge.
3. **Vibrant Sunset:**
   - Base: Linear 135° Instagram gradient (`#4F46E5 0%, #7C3AED 35%, #D946EF 65%, #F43F5E 100%`).
   - Finish: High-gloss vivid print, high-contrast white typography.
4. **Titanium Brushed Steel:**
   - Base: `#16161A`
   - Finish: Horizontal metallic brushed micro-sheen (`repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, ...)`).
   - Accents: Chamfered metallic rim highlight (`border border-white/20`), brushed gold typography (`#F3E5AB`).

---

## 5. Layout Architecture & Section Structure

The campaign website follows a strict 5-section narrative flow:

1. **Header & Navigation:** Minimal, translucent 56px sticky bar with brand indicator, smooth section anchors, and direct "Create Your Card" CTA.
2. **Section 1: Hero:** Full-bleed hero with minimal copy ("Your Instagram. One Tap Away."), studio lighting ambient backdrop, large interactive 3D card preview, and simulated phone tap demonstration.
3. **Section 2: Editorial Product Collection:** Asymmetric layout featuring 1 large hero card (Matte Obsidian PVC, ₹499), 2 stacked supporting cards (Pure White, Vibrant Sunset), and 1 panoramic horizontal flagship (Titanium Brushed Steel, ₹1,499).
4. **Section 3: How It Works:** Sequential numbered milestones (`01`, `02`, `03`) with single concise sentences and native device compatibility ribbon.
5. **Section 4: Custom Design Experience & Checkout:** Dual-option switcher (DIY vs Assign Designer) alongside live sticky card preview and clean checkout form with real-time price calculation.
6. **Section 5: Final CTA, FAQ & Minimal Footer:** High-contrast dark banner, 5-question compact accordion FAQ, and clean footer with WhatsApp support link.

---

## 6. Motion & Interaction Specifications

- **3D Card Flip:** CSS 3D perspective (`[perspective:1200px]`, `[transform-style:preserve-3d]`, `[backface-visibility:hidden]`), transitioning smoothly over 500ms `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Button Transitions:** Hardware-accelerated transitions (150ms-200ms `ease-out`) for hover, active, and focus states.
- **Accordion Toggle:** Smooth 200ms chevron rotation and fluid content expansion.
- **Phone Tap Simulator:** 600ms tap feedback followed by a slide-down iOS-style NFC notification pill.

