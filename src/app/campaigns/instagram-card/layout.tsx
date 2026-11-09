import type { Metadata } from 'next';
import { brandConfig } from '@/config/brand';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';

export const metadata: Metadata = {
  title: `Custom Instagram NFC Smart Card | ${brandConfig.name}`,
  description: `Get your custom Instagram NFC smart card. Tap any phone to instantly open your Instagram profile or digital card. Premium matte finish, zero app required.`,
  alternates: {
    canonical: `${baseUrl}/campaigns/instagram-card`,
  },
  openGraph: {
    type: 'website',
    url: `${baseUrl}/campaigns/instagram-card`,
    title: `Custom Instagram NFC Smart Card | ${brandConfig.name}`,
    description: `Turn real-life interactions into followers. Tap any smartphone to launch your Instagram profile or digital business card.`,
    siteName: brandConfig.name,
    images: [
      {
        url: `${baseUrl}${brandConfig.assets.logoStackedUrl}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.name} Instagram NFC Card`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Custom Instagram NFC Smart Card | ${brandConfig.name}`,
    description: `Tap any phone to connect on Instagram instantly.`,
  },
};

export default function InstagramCardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
