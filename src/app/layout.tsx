import type { Metadata } from 'next';
import { brandConfig } from '@/config/brand';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(brandConfig.appUrl),
  title: `${brandConfig.name} — ${brandConfig.tagline}`,
  description: brandConfig.tagline,
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
    title: `${brandConfig.name} — ${brandConfig.tagline}`,
    description: brandConfig.tagline,
    siteName: brandConfig.name,
    images: [
      {
        url: brandConfig.assets.logoStackedUrl,
        width: 1200,
        height: 630,
        alt: brandConfig.name,
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="en" className="light" data-theme="light">
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
