---
name: template-rendering-engine
description: "Master Tapzio's template rendering system, 6 luxury themes, theme customization swatches, dual-device live preview, and data preservation across template switches."
risk: safe
source: tapzio-core
date_added: "2026-11-02"
version: "1.0.0"
---

# Tapzio Template Rendering Engine Skill

Engineering standard for Tapzio's luxury profile template system, dual-device live previewing, theme token resolution, and content preservation across template transitions.

---

## 1. When to Use This Skill

- Authoring, extending, or styling profile templates in `src/components/templates/`.
- Working with the template discovery marketplace (`src/modules/templates/index.ts`).
- Implementing live preview frames in the profile builder (`src/app/(app)/builder/[id]`).
- Ensuring content integrity and zero data loss when users switch templates.

---

## 2. The 6 Luxury Template Aesthetics

Tapzio features 6 distinct design directions engineered to serve specific professional verticals:

| Template Slug | Identity & Theme | Target Audience | Required Plan |
| :--- | :--- | :--- | :--- |
| **`obsidian-luxury`** | Brushed metallic gold (`#D4AF37`) on deep obsidian (`#0A0A0C`) with matte charcoal cards. | C-Suite executives, partners, enterprise founders | Nano (Free) |
| **`ivory-minimal`** | Warm alabaster editorial paper (`#FAF8F5`) with serif typography and understated luxury. | Architects, doctors, writers, bespoke consultants | Nano (Free) |
| **`aurora-creator`** | Vibrant neon purple & cyan glassmorphism (`#151833`) with subtle backdrop blurs. | Digital artists, creators, agency founders, designers | Micro |
| **`zenith-corporate`** | Enterprise titanium navy (`#0B0F19`) and precision grid borders. | B2B executives, management consultants, corporate attorneys | Mini |
| **`catalyst-business`** | Deep emerald showcase (`#064E3B`) with dedicated product & service shelves. | Retailers, product founders, showroom directors | Mini |
| **`apex-capital`** | Prestige dark graphite and emerald tailored for high-ticket ventures. | Real estate developers, private equity, hedge funds | Max |

---

## 3. Data Preservation Guarantee Across Template Switches

A critical principle of the Tapzio platform: **Templates are lenses over data, not containers.**

When a user switches from `obsidian-luxury` to `ivory-minimal`:
1. All profile fields (name, headline, bio, avatar, cover) remain 100% intact.
2. All linked business cards and brochure URLs remain intact.
3. All product & service catalogue items remain intact.
4. Only `profile.template_id` and presentation theme tokens change.

---

## 4. Dual-Device Live Preview Architecture

In the template marketplace (`/templates`) and the 3-pane profile builder (`/builder/[id]`):
- **Desktop Viewport**: 100% width responsive container displaying full horizontal hierarchy.
- **Mobile Viewport**: 375px x 812px iPhone frame with realistic speaker notch, rounded corners, and device borders, demonstrating the exact tap experience.

```tsx
// Dual-device preview frame wrapper
<div className={isMobileView ? "max-w-[375px] mx-auto rounded-[3rem] border-8 border-neutral-900 shadow-2xl overflow-hidden" : "w-full"}>
  <ProfileRenderer profile={sampleProfile} />
</div>
```

---

## 5. Mandatory Engineering Rules

1. **WCAG 2.2 AA Contrast Compliance**: All template color tokens must maintain a minimum 4.5:1 contrast ratio for body text and 3:1 for large headers.
2. **Never Hardcode Brand Literals**: The template footer must display `Powered by {brandConfig.name}` derived dynamically from `@/config/brand`.
3. **Plan Tier Rank Enforcement**: Always check `canAccessTemplate(requiredPlanId, userPlanId)` before allowing a user to select or save a template.

