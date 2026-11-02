/**
 * WCAG 2.2 Color Contrast Ratio Calculator
 * Standard W3C Formula: (L1 + 0.05) / (L2 + 0.05)
 */

function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1, hex2) {
  const lum1 = relativeLuminance(hexToRgb(hex1));
  const lum2 = relativeLuminance(hexToRgb(hex2));
  const l1 = Math.max(lum1, lum2);
  const l2 = Math.min(lum1, lum2);
  return (l1 + 0.05) / (l2 + 0.05);
}

const pairs = [
  // Direction 1: Obsidian Luxury
  { theme: 'Obsidian', element: 'Primary Text on Canvas', fg: '#FFFFFF', bg: '#0A0A0C' },
  { theme: 'Obsidian', element: 'Secondary Text on Card', fg: '#A1A1AA', bg: '#141418' },
  { theme: 'Obsidian', element: 'Muted Text on Card (Adjusted #8E8E98)', fg: '#8E8E98', bg: '#141418' },
  { theme: 'Obsidian', element: 'Gold CTA Text on Button', fg: '#0A0A0C', bg: '#D4AF37' },
  { theme: 'Obsidian', element: 'Gold Headline on Canvas', fg: '#D4AF37', bg: '#0A0A0C' },
  
  // Direction 2: Ivory Minimal Swiss
  { theme: 'Ivory', element: 'Primary Text on Canvas', fg: '#09090B', bg: '#FBFBFA' },
  { theme: 'Ivory', element: 'Secondary Text on Card', fg: '#27272A', bg: '#FFFFFF' },
  { theme: 'Ivory', element: 'Subtext / Captions on Card', fg: '#71717A', bg: '#FFFFFF' },
  { theme: 'Ivory', element: 'Button Text on Carbon CTA', fg: '#FFFFFF', bg: '#09090B' },

  // Direction 3: Aurora Modern Glass
  // Glass card rgba(255,255,255,0.05) over #0B0F19 is approx #171B26
  { theme: 'Aurora', element: 'Primary Text on Glass Card', fg: '#F8FAFC', bg: '#171B26' },
  { theme: 'Aurora', element: 'Secondary Text on Glass Card', fg: '#94A3B8', bg: '#171B26' },
  { theme: 'Aurora', element: 'Cyan Accent Text on Glass Card', fg: '#38BDF8', bg: '#171B26' },
  { theme: 'Aurora', element: 'Button Text on Cyan CTA', fg: '#FFFFFF', bg: '#0284C7' }
];

console.log('| Theme | Element | Foreground | Background | Contrast Ratio | WCAG 2.2 AA (4.5:1) | WCAG 2.2 AAA (7.0:1) |');
console.log('| :--- | :--- | :---: | :---: | :---: | :---: | :---: |');

const results = pairs.map(p => {
  const ratio = contrastRatio(p.fg, p.bg);
  const aa = ratio >= 4.5 ? 'PASS' : (ratio >= 3.0 ? 'PASS (Large/UI)' : 'FAIL');
  const aaa = ratio >= 7.0 ? 'PASS' : (ratio >= 4.5 ? 'PASS (Large)' : 'FAIL');
  console.log(`| ${p.theme} | ${p.element} | \`${p.fg}\` | \`${p.bg}\` | **${ratio.toFixed(2)}:1** | ${aa} | ${aaa} |`);
  return { ...p, ratio: Number(ratio.toFixed(2)), aa, aaa };
});

