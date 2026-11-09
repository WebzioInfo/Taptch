import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/nfc-business-card',
          '/digital-business-card',
          '/features',
          '/pricing',
          '/how-it-works',
          '/faq',
          '/about',
          '/contact',
          '/templates',
          '/templates/*',
          '/p/*',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/portal-x',
          '/portal-x/*',
          '/dashboard',
          '/dashboard/*',
          '/builder',
          '/builder/*',
          '/cards',
          '/cards/*',
          '/leads',
          '/leads/*',
          '/qr',
          '/qr/*',
          '/settings',
          '/settings/*',
          '/team',
          '/team/*',
          '/claim',
          '/claim/*',
          '/staff',
          '/staff/*',
          '/api',
          '/api/*',
          '/dev',
          '/dev/*',
          '/dq/*',
          '/n/*',
          '/q/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

