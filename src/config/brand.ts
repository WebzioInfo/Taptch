/**
 * Central Brand Configuration Source of Truth
 *
 * RULE: Never hardcode "Tapzio" or any customer brand name in application UI components.
 * All user-facing brand text, assets, and colors must derive from this configuration
 * or dynamic database `system_settings`.
 */

export interface BrandConfig {
  name: string;
  shortName: string;
  tagline: string;
  legalName: string;
  supportEmail: string;
  primaryDomain: string;
  appUrl: string;
  assets: {
    logoUrl: string;
    logoDarkUrl: string;
    faviconUrl: string;
    cardPlaceholderUrl: string;
  };
  theme: {
    defaultMode: 'dark' | 'light';
    primaryColor: string; // Hex color
    accentColor: string;
    obsidianGold: string;
  };
  features: {
    enablePublicRegistration: boolean;
    enableGoogleAuth: boolean;
    enablePhoneOtp: boolean;
    enableWalletPasses: boolean;
    enableCustomDomains: boolean;
  };
}

export const defaultBrandConfig: BrandConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Tapzio',
  shortName: 'Tapzio',
  tagline: 'Intelligent Digital Identity & Smart Networking',
  legalName: 'Webzio Technology Private Limited',
  supportEmail: 'support@tapzio.com',
  primaryDomain: 'tapzio.com',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  assets: {
    logoUrl: '/assets/brand/logo.svg',
    logoDarkUrl: '/assets/brand/logo-dark.svg',
    faviconUrl: '/favicon.ico',
    cardPlaceholderUrl: '/assets/cards/matte-pvc-mockup.png',
  },
  theme: {
    defaultMode: 'dark',
    primaryColor: '#D4AF37', // Champagne Metallic Gold
    accentColor: '#38BDF8',
    obsidianGold: '#D4AF37',
  },
  features: {
    enablePublicRegistration: true,
    enableGoogleAuth: Boolean(process.env.GOOGLE_CLIENT_ID),
    enablePhoneOtp: true,
    enableWalletPasses: false, // M9 feature
    enableCustomDomains: true,
  },
};

export const brandConfig = defaultBrandConfig;

