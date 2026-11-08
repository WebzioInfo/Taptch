/**
 * Independent Campaign Brand & Identity Configuration
 * 
 * Strict Isolation Mandate:
 * This campaign is an entirely independent commercial identity.
 * It must NEVER publicly identify, advertise, mention, or expose the parent development platform.
 * 
 * Uses configurable environment variables with generic default placeholders.
 * Never invent the final brand name; keep it fully configurable via CAMPAIGN_BRAND_NAME.
 */

export interface CampaignBrandConfig {
  name: string;
  tagline: string;
  description: string;
  placeholderName: string;
  domain: string;
  supportEmail: string;
  supportPhone: string;
  supportWhatsapp: string;
  designerWhatsapp: string;
  legalEntity: string;
  gstin: string;
  cardFooterText: string;
  payment: {
    upiVpa: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolder: string;
  };
  meta: {
    title: string;
    description: string;
    keywords: string[];
    ogImageUrl: string;
  };
}

export const campaignBrandConfig: CampaignBrandConfig = {
  name: process.env.NEXT_PUBLIC_CAMPAIGN_BRAND_NAME || 'Smart NFC Profile Card',
  tagline: process.env.NEXT_PUBLIC_CAMPAIGN_TAGLINE || 'Your Instagram. One Tap Away.',
  description: process.env.NEXT_PUBLIC_CAMPAIGN_DESCRIPTION || 'Tap-to-connect personalized contactless Instagram NFC Smart Cards.',
  placeholderName: '[CAMPAIGN_BRAND_NAME]',
  domain: process.env.NEXT_PUBLIC_CAMPAIGN_DOMAIN || 'https://card.instantnfc.me',
  supportEmail: process.env.CAMPAIGN_SUPPORT_EMAIL || 'support@instantnfc.me',
  supportPhone: process.env.CAMPAIGN_SUPPORT_PHONE || '+91 98765 43210',
  supportWhatsapp: process.env.CAMPAIGN_SUPPORT_WHATSAPP || '+919876543210',
  designerWhatsapp: process.env.CAMPAIGN_DESIGNER_WHATSAPP || '+919876543211',
  legalEntity: process.env.CAMPAIGN_LEGAL_ENTITY || 'Contactless Commerce Solutions India Pvt. Ltd.',
  gstin: process.env.CAMPAIGN_GSTIN || '27AAECN0000A1Z5',
  cardFooterText: process.env.NEXT_PUBLIC_CAMPAIGN_CARD_FOOTER || 'Contactless NFC Smart Card',
  payment: {
    upiVpa: process.env.CAMPAIGN_UPI_VPA || 'pay@instantnfc',
    bankName: process.env.CAMPAIGN_BANK_NAME || 'HDFC Bank Ltd',
    accountNumber: process.env.CAMPAIGN_BANK_ACCOUNT || '50200012345678',
    ifscCode: process.env.CAMPAIGN_BANK_IFSC || 'HDFC0000123',
    accountHolder: process.env.CAMPAIGN_BANK_HOLDER || 'Contactless Commerce Solutions',
  },
  meta: {
    title: process.env.NEXT_PUBLIC_CAMPAIGN_META_TITLE || 'Personalized Instagram NFC Cards | Instant Contactless Connection',
    description: process.env.NEXT_PUBLIC_CAMPAIGN_META_DESC || 'Grow your Instagram followers effortlessly. Premium matte contactless NFC cards programmed with your profile.',
    keywords: ['Instagram NFC Card', 'Smart Business Card', 'Contactless Instagram Card', 'NFC Tap Card', 'Social Media Card'],
    ogImageUrl: process.env.NEXT_PUBLIC_CAMPAIGN_OG_IMAGE || '/campaigns/instagram-card/og-preview.png',
  },
};

