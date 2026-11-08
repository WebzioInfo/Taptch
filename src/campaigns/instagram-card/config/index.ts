import { campaignBrandConfig } from './brand.config';

export * from './brand.config';

export const INSTAGRAM_CAMPAIGN_CONFIG = {
  key: 'instagram-card',
  title: campaignBrandConfig.name,
  description: campaignBrandConfig.description,
  defaults: {
    supportWhatsapp: campaignBrandConfig.supportWhatsapp,
    designerWhatsapp: campaignBrandConfig.designerWhatsapp,
    designerFee: 200, // ₹200
    standardShippingFee: 60, // ₹60
    expressShippingFee: 150, // ₹150
    taxRatePercent: 18.0, // 18% GST
  },
  cardDimensions: {
    widthMm: 85.6,
    heightMm: 53.98,
    cornerRadMm: 3.18,
    dpi: 300,
    safeAreaMarginMm: 3.5,
  },
  templates: [
    {
      id: 'classic-dark',
      name: 'Matte Obsidian',
      description: 'Understated matte black background with clean white typography and verified Instagram badge.',
      previewBg: '#0A0A0C',
      previewText: '#FFFFFF',
      accentColor: '#2563EB',
    },
    {
      id: 'gradient-instagram',
      name: 'Vibrant Sunset',
      description: 'Iconic Instagram purple-to-amber radial glow with bold modern layout.',
      previewBg: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)',
      previewText: '#FFFFFF',
      accentColor: '#E1306C',
    },
    {
      id: 'pure-minimalist',
      name: 'Pure White Minimal',
      description: 'Clean architectural white surface with laser-sharp black glyphs and dark borders.',
      previewBg: '#FFFFFF',
      previewText: '#111827',
      accentColor: '#2563EB',
    },
    {
      id: 'executive-metal',
      name: 'Titanium Brushed',
      description: 'Deep metallic gunmetal tone designed specifically for luxury metal and matte PVC.',
      previewBg: '#18181D',
      previewText: '#F3E5AB',
      accentColor: '#D4AF37',
    },
  ],
} as const;

