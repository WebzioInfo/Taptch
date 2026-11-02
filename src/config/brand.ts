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
    logoLightUrl: string;
    logoHorizontalUrl: string;
    logoStackedUrl: string;
    symbolUrl: string;
    monochromeUrl: string;
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
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Tappzio',
  shortName: 'Tappzio',
  tagline: 'Intelligent Digital Identity & Smart Networking',
  legalName: 'Webzio Technology Private Limited',
  supportEmail: 'support@tappzio.com',
  primaryDomain: 'tappzio.com',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  assets: {
    logoUrl: '/branding/logo/tappzio-logo-primary.svg',
    logoDarkUrl: '/branding/logo/tappzio-logo-dark.svg',
    logoLightUrl: '/branding/logo/tappzio-logo-light.svg',
    logoHorizontalUrl: '/branding/logo/tappzio-logo-horizontal.svg',
    logoStackedUrl: '/branding/logo/tappzio-logo-stacked.svg',
    symbolUrl: '/branding/logo/tappzio-symbol.svg',
    monochromeUrl: '/branding/logo/tappzio-monochrome.svg',
    faviconUrl: '/branding/icons/favicon.svg',
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

