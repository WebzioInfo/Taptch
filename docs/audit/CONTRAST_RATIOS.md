# Taptch — WCAG 2.2 Color Contrast Audit & Verification Output

**Measurement Date:** October 31, 2026  
**Methodology:** Measured programmatically using `scripts/compute-contrast.js` implementing the standard W3C relative luminance formula: $(L_1 + 0.05) / (L_2 + 0.05)$.  
**Standard Thresholds:**  
- **WCAG 2.2 Level AA:** $\ge 4.5:1$ for normal text, $\ge 3.0:1$ for large text ($\ge 18$pt or $\ge 14$pt bold) and active UI controls.  
- **WCAG 2.2 Level AAA:** $\ge 7.0:1$ for normal text, $\ge 4.5:1$ for large text.  

---

## 1. Measured Results Table

| Theme | UI Element | Foreground Hex | Background Hex | Measured Contrast | WCAG 2.2 Level AA | WCAG 2.2 Level AAA |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Obsidian** | Primary Headline on Canvas | `#FFFFFF` | `#0A0A0C` | **19.78:1** | **PASS** | **PASS** |
| **Obsidian** | Secondary Subtitle on Card | `#A1A1AA` | `#141418` | **7.17:1** | **PASS** | **PASS** |
| **Obsidian** | Muted Subtext on Card | `#8E8E98` | `#141418` | **5.66:1** | **PASS** | **PASS (Large)** |
| **Obsidian** | Action Dock Button (Text on Gold) | `#0A0A0C` | `#D4AF37` | **9.41:1** | **PASS** | **PASS** |
| **Obsidian** | Accent Headline on Dark Canvas | `#D4AF37` | `#0A0A0C` | **9.41:1** | **PASS** | **PASS** |
| **Ivory** | Primary Text on Alabaster Canvas | `#09090B` | `#FBFBFA` | **19.21:1** | **PASS** | **PASS** |
| **Ivory** | Secondary Text on Pure White Card | `#27272A` | `#FFFFFF` | **14.89:1** | **PASS** | **PASS** |
| **Ivory** | Subtext / Captions on White Card | `#71717A` | `#FFFFFF` | **4.83:1** | **PASS** | **PASS (Large)** |
| **Ivory** | Action Dock Button (Text on Carbon) | `#FFFFFF` | `#09090B` | **19.90:1** | **PASS** | **PASS** |
| **Aurora** | Primary Text on Glass Surface | `#F8FAFC` | `#171B26` | **16.44:1** | **PASS** | **PASS** |
| **Aurora** | Secondary Text on Glass Surface | `#94A3B8` | `#171B26` | **6.71:1** | **PASS** | **PASS (Large)** |
| **Aurora** | Cyan Luminous Accent on Glass | `#38BDF8` | `#171B26` | **8.03:1** | **PASS** | **PASS** |
| **Aurora** | CTA Button (Adjusted `#0369A1`) | `#FFFFFF` | `#0369A1` | **5.67:1** | **PASS** | **PASS (Large)** |

---

## 2. Key Observations & Design Adjustments
1. **Obsidian Theme**: The default Tailwind `#71717A` yielded 3.7:1 on `#141418`. Adjusted muted text to `#8E8E98` to deliver **5.66:1**, safely clearing Level AA for all text sizes.
2. **Aurora Theme CTA**: The initial `#0284C7` reached 4.10:1 (acceptable for large UI buttons, but below the 4.5:1 normal body text threshold). Adjusted primary CTA button background to `#0369A1`, lifting the contrast to **5.67:1** and guaranteeing complete WCAG AA compliance across all components.

