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
    primaryColor: string; // Hex color
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
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'TAPTCH',
  shortName: 'TAPTCH',
  tagline: 'Your professional identity, one link.',
  legalName: 'Webzio Technology Private Limited',
  supportEmail: 'support@taptch.com',
  primaryDomain: 'taptch.com',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  assets: {
    logoUrl: '/branding/logo/taptch-logo-primary.svg',
    logoDarkUrl: '/branding/logo/taptch-logo-dark.svg',
    logoLightUrl: '/branding/logo/taptch-logo-light.svg',
    logoHorizontalUrl: '/branding/logo/taptch-logo-horizontal.svg',
    logoStackedUrl: '/branding/logo/taptch-logo-stacked.svg',
    symbolUrl: '/branding/logo/taptch-symbol.svg',
    monochromeUrl: '/branding/logo/taptch-monochrome.svg',
    faviconUrl: '/branding/icons/favicon.svg',
    cardPlaceholderUrl: '/assets/cards/matte-pvc-mockup.png',
  },
  theme: {
    defaultMode: 'light',
    primaryColor: '#2563EB', // Brand Blue
    primaryHover: '#1D4ED8', // Deep Blue
    accentColor: '#EFF6FF',  // Soft Blue
    surfaceColor: '#F8FAFC', // Secondary Surface
    borderColor: '#E5E7EB',  // Subtle Divider
    textColor: '#111827',    // Primary Text
    mutedColor: '#64748B',   // Muted Secondary Text
  },
  features: {
    enablePublicRegistration: true,
    enableGoogleAuth: Boolean(process.env.GOOGLE_CLIENT_ID),
    enablePhoneOtp: true,
    enableWalletPasses: false,
    enableCustomDomains: true,
  },
};

export const brandConfig = defaultBrandConfig;
