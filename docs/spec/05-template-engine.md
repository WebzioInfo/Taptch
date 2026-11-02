# Tapzio Specification — 05 Template Engine

> Source: Master Prompt Section 5

## Config-Driven Architecture
Templates are defined strictly as **validated JSON specifications** that describe typography, color tokens, layout structures, and block renderer configurations.
- No code deployment is needed to introduce, tweak, or publish templates.
- Super admins create, preview, publish, or deprecate templates directly from the administrative UI.
- Switching a profile from one template to another preserves 100% of underlying content data.

## Template Tokens & Schema
```typescript
interface TemplateConfig {
  id: string;
  name: string;
  category: 'luxury' | 'editorial' | 'modern' | 'minimal' | 'professional' | 'creative';
  version: string;
  typography: {
    headingFont: string; // e.g. Playfair Display, Inter, Space Grotesk
    bodyFont: string;    // e.g. Plus Jakarta Sans, Roboto
    indicSupport: boolean;
  };
  colors: {
    canvasBackground: string;
    cardBackground: string;
    cardBorder: string;
    primaryAccent: string;
    secondaryAccent: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
  };
  layout: {
    heroStyle: 'stacked-avatar' | 'split-banner' | 'floating-card' | 'full-bleed' | 'minimal-header';
    cardStyle: 'flat' | 'elevated' | 'glassmorphic' | 'bordered-clean' | 'neumorphic-soft';
    actionDock: 'sticky-bottom-floating' | 'header-dock' | 'inline-buttons';
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  };
  supportedSections: ProfileSectionType[];
}
```

## Launch Templates (Studio-Grade)
1. **Obsidian** (Dark Luxury):
   - Premium matte black canvas (#0A0A0C), brushed charcoal cards, champagne gold / amber accents (#D4AF37).
   - Designed for C-suite executives, luxury consultants, fine jewellers, and private wealth managers.
2. **Ivory** (Light Editorial):
   - Warm alabaster/parchment background (#FBFBFA), crisp hairline borders, elegant serif typography pair.
   - Tailored for high-end architects, boutique legal practices, authors, and luxury interior studios.
3. **Aurora** (Restrained Glassmorphism):
   - Deep indigo/violet tinted canvas with soft ambient radial glows and frosted translucent glass cards (backdrop-filter: blur).
   - Perfect for tech founders, venture builders, Web3 pioneers, and modern digital agencies.
4. **Mono** (Minimal Brutalist):
   - Pure high-contrast black and white (#000000 / #FFFFFF), stark geometric sans-serif fonts, sharp zero-radius borders.
   - For industrial designers, contemporary artists, software architects, and minimalist creators.
5. **Counsel** (Executive Professional):
   - Navy and slate palette (#0F172A / #1E293B) with trust-oriented royal blue accents (#2563EB).
   - Designed for doctors, chartered accountants, legal advocates, and management consultants.
6. **Studio** (Creative Portfolio):
   - Dynamic canvas featuring vibrant pop accents, masonry card grids, and high-impact visual media showcases.
   - Suited for commercial photographers, videographers, visual artists, and fashion stylists.

## Design Rules & Accessibility
- Designed mobile-first at 390×844 px (iPhone standard viewport).
- Sticky bottom thumb-reach action dock for primary actions (Save Contact, Call, WhatsApp, Exchange).
- Automatic contrast verification: Any custom accent color is checked against WCAG AA standards (4.5:1 ratio for normal text, 3:1 for large UI).
- No generic blue buttons, no emojis used as UI icons, no uncurated stock placeholder visuals.

