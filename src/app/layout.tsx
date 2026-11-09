import type { Metadata } from 'next';
import { brandConfig } from '@/config/brand';
import { geistSans, geistMono } from '@/config/fonts';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${brandConfig.name} — ${brandConfig.tagline}`,
    template: `%s | ${brandConfig.name}`,
  },
  description: `${brandConfig.name} is the modern digital identity and NFC business card platform. Tap with any smartphone or scan QR to share contact details, catalogues, portfolios, and multiple business profiles instantly.`,
  keywords: [
    'nfc business card',
    'digital business card',
    'smart business card',
    'nfc visiting card',
    'contactless business card',
    'digital profile',
    'digital identity',
    'vcard download',
    'qr code business card',
    'executive digital card',
    'india nfc cards',
  ],
  authors: [{ name: brandConfig.legalName, url: siteUrl }],
  creator: brandConfig.name,
  publisher: brandConfig.legalName,
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/branding/icons/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    title: `${brandConfig.name} — ${brandConfig.tagline}`,
    description: `Share your contact info, social links, portfolio, and businesses in one tap. The premium NFC and digital business card platform.`,
    siteName: brandConfig.name,
    images: [
      {
        url: brandConfig.assets.logoStackedUrl,
        width: 1200,
        height: 630,
        alt: `${brandConfig.name} Smart Digital Identity`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${brandConfig.name} — ${brandConfig.tagline}`,
    description: `The smart NFC business card and digital identity platform. Tap or scan to connect instantly.`,
    images: [brandConfig.assets.logoStackedUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brandConfig.name,
    legalName: brandConfig.legalName,
    url: siteUrl,
    logo: `${siteUrl}${brandConfig.assets.logoStackedUrl}`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: brandConfig.supportEmail,
      contactType: 'customer support',
      availableLanguage: ['en', 'hi'],
    },
    sameAs: [
      'https://www.linkedin.com/company/taptch',
      'https://www.instagram.com/taptch.official',
      'https://twitter.com/taptchofficial',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brandConfig.name,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/templates?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html
      lang="en"
      className={`light ${geistSans.variable} ${geistMono.variable}`}
      data-theme="light"
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
