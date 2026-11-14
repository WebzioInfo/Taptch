/**
 * Curated Vector Artwork Catalog
 * Reusable vector design assets: NFC Contactless waves, Luxury Crests,
 * Social Media monochrome glyphs, and verification emblems.
 */

export interface ArtworkItem {
  id: string;
  name: string;
  category: 'nfc' | 'social' | 'contact' | 'crests' | 'badges';
  svg: string;
  defaultColor: string;
  width: number;
  height: number;
  viewBox?: string;
}

export const ARTWORK_COLLECTION: ArtworkItem[] = [
  // NFC Wave Icons (Physical card indicator)
  {
    id: 'art_nfc_waves_classic',
    name: 'NFC Contactless Waves',
    category: 'nfc',
    defaultColor: '#D4AF37',
    width: 48,
    height: 48,
    viewBox: '0 0 24 24',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 12a6 6 0 0 1 6-6"/>
      <path d="M3 12a9 9 0 0 1 9-9"/>
      <path d="M9 12a3 3 0 0 1 3-3"/>
      <path d="M12 12h.01"/>
    </svg>`,
  },
  {
    id: 'art_nfc_chip_symbol',
    name: 'Smart Chip Decal',
    category: 'nfc',
    defaultColor: '#D4AF37',
    width: 64,
    height: 50,
    viewBox: '0 0 64 50',
    svg: `<svg viewBox="0 0 64 50" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="60" height="46" rx="6" stroke="currentColor" fill="none"/>
      <line x1="2" y1="18" x2="24" y2="18"/>
      <line x1="2" y1="32" x2="24" y2="32"/>
      <line x1="40" y1="18" x2="62" y2="18"/>
      <line x1="40" y1="32" x2="62" y2="32"/>
      <circle cx="32" cy="25" r="9"/>
    </svg>`,
  },

  // Luxury Crests & Monograms
  {
    id: 'art_crest_laurel',
    name: 'Laurel Wreath Monogram',
    category: 'crests',
    defaultColor: '#D4AF37',
    width: 80,
    height: 80,
    viewBox: '0 0 100 100',
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 80C15 65 15 35 35 20C30 30 32 45 40 55"/>
      <path d="M75 80C85 65 85 35 65 20C70 30 68 45 60 55"/>
      <circle cx="50" cy="50" r="14" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'art_badge_verified',
    name: 'Executive Verified Seal',
    category: 'badges',
    defaultColor: '#D4AF37',
    width: 48,
    height: 48,
    viewBox: '0 0 24 24',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 5.26L19.5 5.74L20.35 10.15L23.44 13.41L21.27 17.26L21.75 21.67L17.34 22.52L14.08 25.61L10.23 23.44L5.82 23.92L4.97 19.51L1.88 16.25L4.05 12.4L3.57 7.99L7.98 7.14L11.24 4.05L15.09 6.22Z" fill="none"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>`,
  },

  // Social & Contact Glyphs
  {
    id: 'art_social_linkedin',
    name: 'LinkedIn Icon',
    category: 'social',
    defaultColor: '#FFFFFF',
    width: 32,
    height: 32,
    viewBox: '0 0 24 24',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c-.97 0-1.75-.79-1.75-1.76s.78-1.76 1.75-1.76 1.75.79 1.75 1.76-.78 1.76-1.75 1.76m1.4 9.74v-8.37H5.06v8.37h2.8z"/>
    </svg>`,
  },
  {
    id: 'art_social_instagram',
    name: 'Instagram Icon',
    category: 'social',
    defaultColor: '#FFFFFF',
    width: 32,
    height: 32,
    viewBox: '0 0 24 24',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>`,
  },
  {
    id: 'art_social_x',
    name: 'X (Twitter) Icon',
    category: 'social',
    defaultColor: '#FFFFFF',
    width: 32,
    height: 32,
    viewBox: '0 0 24 24',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>`,
  },
  {
    id: 'art_contact_globe',
    name: 'Website Globe',
    category: 'contact',
    defaultColor: '#D4AF37',
    width: 32,
    height: 32,
    viewBox: '0 0 24 24',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>`,
  },
  {
    id: 'art_contact_mail',
    name: 'Mail Envelope',
    category: 'contact',
    defaultColor: '#D4AF37',
    width: 32,
    height: 32,
    viewBox: '0 0 24 24',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>`,
  },
  {
    id: 'art_contact_phone',
    name: 'Direct Phone',
    category: 'contact',
    defaultColor: '#D4AF37',
    width: 32,
    height: 32,
    viewBox: '0 0 24 24',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>`,
  },
];

