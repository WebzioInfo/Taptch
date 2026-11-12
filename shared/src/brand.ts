/**
 * Central Brand Configuration Source of Truth
 *
 * RULE: Never hardcode "TAPTCH" or any customer brand name in application UI components.
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
    defaultMode: 'light' | 'dark';
    primaryColor: string;
    primaryHover: string;
    accentColor: string;
    surfaceColor: string;
    borderColor: string;
    textColor: string;
    mutedColor: string;
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
  name: 'TAPTCH',
  shortName: 'TAPTCH',
  tagline: 'Your professional identity, one link.',
  legalName: 'Webzio Technology Private Limited',
  supportEmail: 'support@taptch.com',
  primaryDomain: 'taptch.com',
  appUrl: 'https://taptch.com',
  assets: {
    logoUrl: '/branding/logo/taptch-logo-primary.svg',
    logoDarkUrl: '/branding/logo/taptch-logo-dark.svg',
    logoLightUrl: '/branding/logo/taptch-logo-light.svg',
    logoHorizontalUrl: '/branding/logo/taptch-logo-horizontal.svg',
    logoStackedUrl: '/branding/logo/taptch-logo-stacked.svg',
    symbolUrl: '/branding/logo/taptch-symbol.svg',
    monochromeUrl: '/branding/logo/taptch-symbol.svg',
    faviconUrl: '/branding/logo/favicon.ico',
    cardPlaceholderUrl: '/branding/cards/default-card-preview.png',
  },
  theme: {
    defaultMode: 'dark',
    primaryColor: '#D4AF37', // Metallic Brushed Gold
    primaryHover: '#B5942E',
    accentColor: '#E5C058',
    surfaceColor: '#121216', // Obsidian Surface
    borderColor: '#23232A',
    textColor: '#F4F4F6',
    mutedColor: '#8C8C9A',
  },
  features: {
    enablePublicRegistration: true,
    enableGoogleAuth: false,
    enablePhoneOtp: true,
    enableWalletPasses: false,
    enableCustomDomains: true,
  },
};

export const brandConfig = defaultBrandConfig;
