import type { Metadata } from 'next';
import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, ArrowRight } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';

export const metadata: Metadata = {
  title: `Frequently Asked Questions (FAQ) — NFC & Digital Cards`,
  description: `Find answers to common questions about ${brandConfig.name} NFC business cards, device compatibility, dynamic QR codes, profile updates, and privacy security.`,
  alternates: {
    canonical: `${baseUrl}/faq`,
  },
  openGraph: {
    title: `Frequently Asked Questions | ${brandConfig.name}`,
    description: `Everything you need to know about NFC business cards, digital identity profiles, and pricing.`,
    url: `${baseUrl}/faq`,
    siteName: brandConfig.name,
    images: [
      {
        url: `${baseUrl}${brandConfig.assets.logoStackedUrl}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.name} FAQ`,
      },
    ],
  },
};

export default function FaqPage() {
  const faqs = [
    {
      q: 'Do recipients need an app to view my digital business card?',
      a: 'No. When someone taps your NFC card or scans your QR code, your profile opens instantly in their native mobile browser (Safari, Chrome, etc.). No app installation or sign-up is required for the recipient.',
    },
    {
      q: 'Which smartphones are compatible with NFC tapping?',
      a: 'Virtually all modern smartphones support NFC. All iPhones from iPhone XR, XS, 11, 12, 13, 14, 15, and 16 have background NFC tag reading enabled by default. Android phones running Android 8+ with NFC enabled (Samsung, Pixel, OnePlus, Xiaomi, etc.) read cards instantly. For any older phone without NFC, your card includes a high-resolution dynamic QR code on the back.',
    },
    {
      q: 'Can I change my contact details after printing or encoding the card?',
      a: 'Yes, absolutely. Your physical NFC card stores a dynamic, secure URL. You can update your phone number, email, address, job title, company bio, and portfolio at any time from your online dashboard. All updates reflect instantly without needing a new physical card.',
    },
    {
      q: 'How does the "Save Contact" button work?',
      a: 'When a visitor taps "Save Contact" on your digital profile, their phone automatically downloads a standard vCard (.vcf) file. Opening this file immediately adds your name, photo, phone number, email, website, and company directly into their smartphone phonebook.',
    },
    {
      q: 'Can I link multiple businesses to a single profile?',
      a: 'Yes! On our Micro, Mini, and Max plans, you can link 1, 3, or up to 10 distinct businesses to your personal profile. Each business can have its own logo, description, catalogue, and website link, letting you represent all your ventures in one place.',
    },
    {
      q: 'How long does a physical NFC card last?',
      a: 'Our cards use genuine NXP NTAG216 microchips rated for over 100,000 read cycles and 10+ years of data retention. The cards require no battery or charging because they draw passive power from the smartphone antenna during the tap.',
    },
    {
      q: 'Is my data secure and private?',
      a: 'Yes. We strictly follow India’s Digital Personal Data Protection (DPDP) Act. We never sell your data or your contacts’ data to third parties. Furthermore, visitor analytics are tracked with privacy-safe 24-hour rotating salt hashing rather than storing raw IP addresses.',
    },
    {
      q: 'Can I use a custom domain for my digital card?',
      a: 'Yes. On the Max plan, you can connect your own custom domain or subdomain (e.g., card.yourbrand.com) with automated SSL encryption.',
    },
    {
      q: 'Do you offer bulk orders for corporate teams?',
      a: 'Yes. We provide enterprise onboarding, custom front-and-back Pantone color matching, logo laser-engraving, and centralized staff directory management for companies with 10 to 5,000+ employees.',
    },
    {
      q: 'Where do you ship physical NFC cards?',
      a: 'We ship across all pin codes in India with reliable express courier tracking. Standard delivery typically takes 3 to 5 business days after order confirmation.',
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'FAQ',
        item: `${baseUrl}/faq`,
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Header */}
      <section className="container mx-auto max-w-4xl px-4 sm:px-6 pt-16 pb-12 text-center">
        <Badge variant="brand" className="text-xs px-2.5 py-1 font-medium bg-blue-50 text-blue-700 border-blue-100 mb-4">
          Support & Guidance
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
          Everything you need to know about NFC business cards, digital profiles, device compatibility, and subscriptions.
        </p>
      </section>

      {/* FAQs List */}
      <section className="container mx-auto max-w-4xl px-4 sm:px-6 pb-20">
        <div className="space-y-6">
          {faqs.map((f, idx) => (
            <div key={idx} className="p-6 rounded-xl border border-border/80 bg-card">
              <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <span>{f.q}</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-3 pl-8 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Still Have Questions CTA */}
      <section className="border-t border-border/60 bg-muted/20 py-16 text-center">
        <div className="container mx-auto max-w-3xl px-4 space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Still have questions?</h2>
          <p className="text-sm text-muted-foreground">
            Our team is here to assist with custom designs, compatibility checks, and corporate deployments.
          </p>
          <div className="pt-2">
            <Link href="/contact">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6">
                Contact Support <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

