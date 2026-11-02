---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

# Frontend Design

Approach every design challenge as the design lead at a premier studio known for giving every product a distinct visual identity that is never mistaken for anyone else's. Reject proposals that feel cliché or templated. Make deliberate, opinionated choices about palette, typography, layout, and copywriting specific to the brief, and take calculated aesthetic risks.

Implement real, production-grade working code (React, Next.js, HTML/CSS/Tailwind) that is:
- Production-grade, accessible, and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point of view
- Meticulously refined in every detail

---

## 1. Ground Designs in the Subject Matter

If the brief does not identify what the product or subject matter is, identify it before designing and align on it. The subject's industry, subject matter, materials, vernacular, and audience are where distinctive visual choices originate:
- A digital identity for luxury architects will be radically different from a card for tech founders or creative freelancers.
- Commit to a clear conceptual direction: Obsidian luxury, ivory minimalist editorial, retro-futuristic, organic/natural, brutalist/raw, or vibrant creator glassmorphism.
- Avoid middle-of-the-road blandness. Intentionality outperforms timid compromises.

---

## 2. Design Thinking & Planning

Work in two deliberate passes:
1. **Short Design Plan**:
   - **Color**: Describe the core base palette as 4–6 named CSS tokens/hex values. Establish dominant tones and sharp accents rather than evenly distributed palettes.
   - **Type**: Select typefaces with intentional roles (display, body, monospace accents) and define scale following *The Elements of Typographic Style*.
   - **Layout**: Draft a layout concept with ASCII wireframes or structural descriptions. Establish alignment rules (left, center, asymmetric).
   - **Principles**: 2–3 high-level rules defining what makes this interface unique.
2. **Review Against the Brief**:
   - Inspect the plan for generic defaults (e.g. standard AI purple gradients, card soup).
   - Revise and make deliberate choices before writing code.

---

## 3. Typographic & Visual Rules

Typography carries the personality of the page:
- **Font Selection**: Choose fonts deliberately. Pair a distinctive display font with a refined, highly legible body font. Avoid overused defaults (Arial, Inter, Roboto, Space Grotesk) across all creations.
- **Line Length & Spacing**: Keep line lengths under 80 characters for optimal reading ergonomics. Provide serif body text slightly more line-height than sans-serif.
- **Anti-Patterns in Typography**:
  - Do NOT accent a single random word or phrase in a headline with bold/italic or gradient unless structurally justified.
  - Do NOT use ALL-CAPS tracked eyebrows across every card and heading.
  - Do NOT add decorative numbers (`01 / 02 / 03`) unless the content is genuinely a sequential process or timeline.
- **Spatial Composition**: Unexpected layouts, asymmetry, subtle overlaps, grid-breaking moments, and controlled density.
- **Atmosphere & Depth**: Add subtle contextual effects: hairline borders (`border-white/10`), ambient radial glows, grain/noise overlays, and calibrated shadows. Avoid heavy blurred backdrops that cause GPU paint jank.

---

## 4. Anti-Patterns to Avoid (AI Design Tells)

Avoid the predictable hallmarks of generated UI:
1. Warm cream background (`#F4F1EA`) with high-contrast serif and terracotta/clay accent (`#D97757`).
2. Near-black background with a single neon acid-green or vermilion accent.
3. SaaS-card kit: content chopped into identical rounded cards with identical radii, identical soft grey shadows (`rgba(0,0,0,0.1)`), and gradient washes.
4. Template chrome: tracked-out ALL-CAPS eyebrows, meta strings joined with middle dots (`A · B · C`), spaced em dashes (`WORD — fragment`), and `→` appended to every button.
5. Indiscriminate motion: fade-and-slide-up entrances on every single card and hover transitions everywhere.

---

## 5. Motion, Restraint & Self-Critique

- **One Orchestrated Moment**: A single orchestrated page-load sequence or hero reveal lands with far greater delight than scattered micro-interactions.
- **Action-Driven Feedback**: Animations should answer a user's action (opening, expanding, confirming, tab switching) with 150ms–200ms easing (`cubic-bezier(0.16, 1, 0.3, 1)`). Respect `prefers-reduced-motion`.
- **Restraint**: Spend boldness in one primary place. Let one element be the memorable showstopper, and keep everything around it disciplined and quiet.
- **Quality Floor**: Responsive down to 360px mobile, visible keyboard focus indicators, WCAG AA/AAA contrast ratios, and touch targets $\ge 44 \times 44\text{px}$.

---

## 6. Writing & UX Copy in Design

Words are design elements, not decoration. Bring the same intentionality to copywriting as to color and spacing:
- **User Perspective**: Name items by what users understand in simple language, not by system architecture (e.g. "Manage notifications", not "Webhook configuration").
- **Active Voice & Consistency**: CTAs state exact actions ("Save changes", "Publish card"). If a button says "Publish", the completion toast says "Published".
- **Constructive Errors & States**: Explain what went wrong and provide an immediate retry action. Empty states must be an inviting call to action, not a dead end.
