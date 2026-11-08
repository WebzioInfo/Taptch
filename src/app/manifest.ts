import type { MetadataRoute } from 'next';
import { brandConfig } from '@/config/brand';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brandConfig.name,
    short_name: brandConfig.shortName,
    description: brandConfig.tagline,
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0C',
    theme_color: brandConfig.theme.primaryColor,
    icons: [
      {
        src: '/branding/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/branding/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/branding/icons/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}

