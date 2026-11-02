import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OUT_DIR = path.resolve('public/branding');
const LOGO_DIR = path.join(OUT_DIR, 'logo');
const ICONS_DIR = path.join(OUT_DIR, 'icons');
const BRAND_DIR = path.join(OUT_DIR, 'brand');

[LOGO_DIR, ICONS_DIR, BRAND_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/**
 * ---------------------------------------------------------------------------
 * TAPPZIO NEXUS SYMBOL DEFINITION
 * The architectural letter 'T' integrated with dual NFC radiating facets
 * and a central digital identity pillar.
 * ---------------------------------------------------------------------------
 */
function getSymbolSvgSnippet({
  colorMode = 'gold', // 'gold' | 'light' | 'dark' | 'monochrome'
  idPrefix = 'tpl',
} = {}) {
  // Gradients and fill styling based on colorMode
  let defs = '';
  let wingLeftFill = '';
  let wingRightFill = '';
  let pillarFill = '';
  let coreFill = '';
  let auraFill = '';

  if (colorMode === 'gold') {
    defs = `
      <linearGradient id="${idPrefix}-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F3E7C4" />
        <stop offset="40%" stop-color="#D4AF37" />
        <stop offset="100%" stop-color="#AA820A" />
      </linearGradient>
      <linearGradient id="${idPrefix}-wing-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="60%" stop-color="#E2E8F0" />
        <stop offset="100%" stop-color="#94A3B8" />
      </linearGradient>
      <linearGradient id="${idPrefix}-core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCD34D" />
        <stop offset="100%" stop-color="#D4AF37" />
      </linearGradient>
      <filter id="${idPrefix}-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    `;
    wingLeftFill = `url(#${idPrefix}-gold-grad)`;
    wingRightFill = `url(#${idPrefix}-gold-grad)`;
    pillarFill = `url(#${idPrefix}-gold-grad)`;
    coreFill = `url(#${idPrefix}-core-grad)`;
    auraFill = '#D4AF37';
  } else if (colorMode === 'dark') {
    // For light backgrounds: deep obsidian / charcoal
    defs = `
      <linearGradient id="${idPrefix}-dark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E293B" />
        <stop offset="100%" stop-color="#0A0A0C" />
      </linearGradient>
    `;
    wingLeftFill = `url(#${idPrefix}-dark-grad)`;
    wingRightFill = `url(#${idPrefix}-dark-grad)`;
    pillarFill = `url(#${idPrefix}-dark-grad)`;
    coreFill = '#D4AF37'; // gold jewel core
    auraFill = '#D4AF37';
  } else if (colorMode === 'light') {
    // For dark backgrounds: platinum white with gold jewel
    defs = `
      <linearGradient id="${idPrefix}-light-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="100%" stop-color="#E2E8F0" />
      </linearGradient>
    `;
    wingLeftFill = `url(#${idPrefix}-light-grad)`;
    wingRightFill = `url(#${idPrefix}-light-grad)`;
    pillarFill = `url(#${idPrefix}-light-grad)`;
    coreFill = '#D4AF37';
    auraFill = '#D4AF37';
  } else {
    // Monochrome: pure white or pure black
    defs = '';
    wingLeftFill = 'currentColor';
    wingRightFill = 'currentColor';
    pillarFill = 'currentColor';
    coreFill = 'currentColor';
    auraFill = 'currentColor';
  }

  // Geometric path elements (100x100 viewBox)
  return `
    <defs>${defs}</defs>
    <g class="tappzio-symbol-mark">
      <!-- Left Contactless Wave Wing of T -->
      <path
        d="M 14,24 L 46,24 C 47.1,24 48,24.9 48,26 L 48,38 C 48,39.1 47.1,40 46,40 L 26,40 C 23.8,40 21.8,38.8 20.8,36.9 L 14.8,26.9 C 14.1,25.7 14.9,24 16.4,24 Z"
        fill="${wingLeftFill}"
      />

      <!-- Right Contactless Wave Wing of T -->
      <path
        d="M 54,24 L 86,24 C 87.5,24 88.3,25.7 87.6,26.9 L 81.6,36.9 C 80.6,38.8 78.6,40 76.4,40 L 54,40 C 52.9,40 52,39.1 52,38 L 52,26 C 52,24.9 52.9,24 54,24 Z"
        fill="${wingRightFill}"
      />

      <!-- Central Vertical Digital Identity Pillar -->
      <path
        d="M 42,42 L 58,42 C 59.1,42 60,42.9 60,44 L 60,78 C 60,79.5 59.2,80.9 57.9,81.6 L 50.8,85.6 C 50.3,85.9 49.7,85.9 49.2,85.6 L 42.1,81.6 C 40.8,80.9 40,79.5 40,78 L 40,44 C 40,42.9 40.9,42 42,42 Z"
        fill="${pillarFill}"
      />

      <!-- Apex Contactless Nexus Core / NFC Diamond Pulse -->
      <path
        d="M 50,14 L 59,23 L 50,32 L 41,23 Z"
        fill="${coreFill}"
      />

      <!-- Symmetrical Outer Contactless Electromagnetic Arcs (NFC Aura Pulse) -->
      <path
        d="M 12,46 C 8.5,52 6.5,59 6.5,66.5 C 6.5,74 8.5,81 12,87"
        fill="none"
        stroke="${auraFill}"
        stroke-width="3"
        stroke-linecap="round"
        opacity="0.85"
      />
      <path
        d="M 88,46 C 91.5,52 93.5,59 93.5,66.5 C 93.5,74 91.5,81 88,87"
        fill="none"
        stroke="${auraFill}"
        stroke-width="3"
        stroke-linecap="round"
        opacity="0.85"
      />
      
      <!-- Inner Resonance Pulse Arcs -->
      <path
        d="M 20,54 C 18,58 17,62 17,66.5 C 17,71 18,75 20,79"
        fill="none"
        stroke="${auraFill}"
        stroke-width="2.5"
        stroke-linecap="round"
        opacity="0.45"
      />
      <path
        d="M 80,54 C 82,58 83,62 83,66.5 C 83,71 82,75 80,79"
        fill="none"
        stroke="${auraFill}"
        stroke-width="2.5"
        stroke-linecap="round"
        opacity="0.45"
      />
    </g>
  `;
}

/**
 * ---------------------------------------------------------------------------
 * TAPPZIO WORDMARK SVG DEFINITION
 * Custom geometric grotesque letterforms
 * ---------------------------------------------------------------------------
 */
function getWordmarkSvgSnippet({
  color = '#FFFFFF',
  accentColor = '#D4AF37',
  x = 0,
  y = 0,
  scale = 1,
} = {}) {
  return `
    <g transform="translate(${x}, ${y}) scale(${scale})" class="tappzio-wordmark">
      <text
        x="0"
        y="30"
        font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        font-size="28"
        font-weight="900"
        letter-spacing="0.18em"
        fill="${color}"
      >
        TAPP<tspan fill="${accentColor}">Z</tspan>IO
      </text>
    </g>
  `;
}

/**
 * 1. Primary Logo (Horizontal Lockup with Gold Symbol & White Wordmark)
 * Ideal for dark backgrounds and default navbar
 */
function generatePrimaryLogoSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="320" height="80" fill="none">
  <g transform="translate(6, 4) scale(0.72)">
    ${getSymbolSvgSnippet({ colorMode: 'gold', idPrefix: 'prim' })}
  </g>
  ${getWordmarkSvgSnippet({ color: '#FFFFFF', accentColor: '#D4AF37', x: 88, y: 17, scale: 0.95 })}
</svg>`;
}

/**
 * 2. Light Version (For Dark Backgrounds: Crisp Platinum & Gold)
 */
function generateLightLogoSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="320" height="80" fill="none">
  <g transform="translate(6, 4) scale(0.72)">
    ${getSymbolSvgSnippet({ colorMode: 'light', idPrefix: 'light' })}
  </g>
  ${getWordmarkSvgSnippet({ color: '#F8FAFC', accentColor: '#D4AF37', x: 88, y: 17, scale: 0.95 })}
</svg>`;
}

/**
 * 3. Dark Version (For Light / Paper / Alabaster Backgrounds)
 */
function generateDarkLogoSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="320" height="80" fill="none">
  <g transform="translate(6, 4) scale(0.72)">
    ${getSymbolSvgSnippet({ colorMode: 'dark', idPrefix: 'dark' })}
  </g>
  ${getWordmarkSvgSnippet({ color: '#0F172A', accentColor: '#B45309', x: 88, y: 17, scale: 0.95 })}
</svg>`;
}

/**
 * 4. Horizontal Compact Logo (Optimized for Narrow Navbar)
 */
function generateHorizontalLogoSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 64" width="280" height="64" fill="none">
  <g transform="translate(4, 2) scale(0.6)">
    ${getSymbolSvgSnippet({ colorMode: 'gold', idPrefix: 'horiz' })}
  </g>
  ${getWordmarkSvgSnippet({ color: '#FFFFFF', accentColor: '#D4AF37', x: 74, y: 12, scale: 0.85 })}
</svg>`;
}

/**
 * 5. Stacked Logo (Centered Symbol over Wordmark + Tagline)
 * Ideal for splash screens, packaging, cards
 */
function generateStackedLogoSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 200" width="240" height="200" fill="none">
  <g transform="translate(70, 10) scale(1.0)">
    ${getSymbolSvgSnippet({ colorMode: 'gold', idPrefix: 'stacked' })}
  </g>
  ${getWordmarkSvgSnippet({ color: '#FFFFFF', accentColor: '#D4AF37', x: 26, y: 110, scale: 0.85 })}
  <text
    x="120"
    y="172"
    text-anchor="middle"
    font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    font-size="8.5"
    font-weight="600"
    letter-spacing="0.28em"
    fill="#94A3B8"
  >
    DIGITAL IDENTITY &amp; SMART NFC
  </text>
</svg>`;
}

/**
 * 6. Symbol-Only (Icon mark)
 */
function generateSymbolSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" fill="none">
  ${getSymbolSvgSnippet({ colorMode: 'gold', idPrefix: 'sym' })}
</svg>`;
}

/**
 * 7. Monochrome Logo (For Laser Engraving on Steel/Metal NFC Cards)
 */
function generateMonochromeSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="320" height="80" fill="none">
  <g transform="translate(6, 4) scale(0.72)" fill="#FFFFFF">
    ${getSymbolSvgSnippet({ colorMode: 'monochrome', idPrefix: 'mono' })}
  </g>
  ${getWordmarkSvgSnippet({ color: '#FFFFFF', accentColor: '#FFFFFF', x: 88, y: 17, scale: 0.95 })}
</svg>`;
}

/**
 * 8. Favicon SVG
 */
function generateFaviconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <rect width="64" height="64" rx="14" fill="#0A0A0C" />
  <g transform="translate(7, 7) scale(0.5)">
    ${getSymbolSvgSnippet({ colorMode: 'gold', idPrefix: 'fav' })}
  </g>
</svg>`;
}

/**
 * Generate All Assets
 */
async function buildAssets() {
  console.log('Generating Tappzio Brand Identity SVG Assets...');

  const svgs = {
    'tappzio-logo-primary.svg': generatePrimaryLogoSvg(),
    'tappzio-logo-light.svg': generateLightLogoSvg(),
    'tappzio-logo-dark.svg': generateDarkLogoSvg(),
    'tappzio-logo-horizontal.svg': generateHorizontalLogoSvg(),
    'tappzio-logo-stacked.svg': generateStackedLogoSvg(),
    'tappzio-symbol.svg': generateSymbolSvg(),
    'tappzio-monochrome.svg': generateMonochromeSvg(),
  };

  for (const [filename, content] of Object.entries(svgs)) {
    const filePath = path.join(LOGO_DIR, filename);
    fs.writeFileSync(filePath, content.trim(), 'utf-8');
    console.log(`✓ Created: ${filePath}`);
  }

  // Favicon SVG in icons and root public
  const faviconSvg = generateFaviconSvg();
  fs.writeFileSync(path.join(ICONS_DIR, 'favicon.svg'), faviconSvg.trim(), 'utf-8');
  fs.writeFileSync(path.resolve('public/favicon.svg'), faviconSvg.trim(), 'utf-8');
  console.log('✓ Created: public/branding/icons/favicon.svg & public/favicon.svg');

  // Rasterize high-resolution PNG icons using sharp
  console.log('Rasterizing High-Res App Icons (192, 512, apple-touch-icon)...');

  // Base icon SVG with luxury obsidian background for app launcher
  const appIconSvg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
    <rect width="512" height="512" rx="112" fill="#0A0A0C" />
    <rect x="12" y="12" width="488" height="488" rx="100" stroke="#D4AF37" stroke-width="2" stroke-opacity="0.3" fill="none" />
    <g transform="translate(86, 86) scale(3.4)">
      ${getSymbolSvgSnippet({ colorMode: 'gold', idPrefix: 'appicon' })}
    </g>
  </svg>`;

  const appIconBuffer = Buffer.from(appIconSvg);

  await sharp(appIconBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(ICONS_DIR, 'icon-192.png'));
  console.log('✓ Created: public/branding/icons/icon-192.png (192x192)');

  await sharp(appIconBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(ICONS_DIR, 'icon-512.png'));
  console.log('✓ Created: public/branding/icons/icon-512.png (512x512)');

  await sharp(appIconBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
  console.log('✓ Created: public/branding/icons/apple-touch-icon.png (180x180)');

  // Also copy to root public for default browser lookups
  fs.copyFileSync(path.join(ICONS_DIR, 'apple-touch-icon.png'), path.resolve('public/apple-touch-icon.png'));
  console.log('✓ Copied: public/apple-touch-icon.png');

  // Also generate standard 32x32 favicon.ico using sharp png
  await sharp(appIconBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.resolve('public/favicon.ico'));
  console.log('✓ Created: public/favicon.ico (32x32)');

  console.log('\nAll brand identity assets generated successfully!');
}

buildAssets().catch((err) => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});

