import type { Metadata } from 'next';
import { brandConfig } from '@/config/brand';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';

export const metadata: Metadata = {
  title: `Luxury Profile Templates & Digital Card Designs | ${brandConfig.name}`,
  description: `Browse luxury, minimalist, and executive digital business card templates. Crafted for founders, consultants, creators, and teams using ${brandConfig.name}.`,
  alternates: {
    canonical: `${baseUrl}/templates`,
  },
  openGraph: {
    type: 'website',
    url: `${baseUrl}/templates`,
    title: `Digital Business Card Templates | ${brandConfig.name}`,
    description: `Browse executive templates designed for contactless networking, personal branding, and multi-business profiles.`,
    siteName: brandConfig.name,
    images: [
      {
        url: `${baseUrl}${brandConfig.assets.logoStackedUrl}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.name} Template Showcase`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Digital Business Card Templates | ${brandConfig.name}`,
    description: `Executive digital card templates for founders and teams.`,
  },
};

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

