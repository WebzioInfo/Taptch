import type { Metadata } from 'next';
import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Cpu,
  RefreshCw,
  QrCode,
} from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';

export const metadata: Metadata = {
  title: `NFC Business Card — Smart Contactless Tap Cards`,
  description: `Order premium NFC business cards crafted with stainless steel, bamboo, or matte PVC. Tap with any iPhone or Android to share your digital identity. No app needed.`,
  alternates: {
    canonical: `${baseUrl}/nfc-business-card`,
  },
  openGraph: {
    title: `NFC Business Card — Smart Contactless Tap Cards | ${brandConfig.name}`,
    description: `Tap any smartphone to share your professional profile, contact details, and catalog instantly. Engineered with high-grade NTAG216 chips.`,
    url: `${baseUrl}/nfc-business-card`,
    siteName: brandConfig.name,
    images: [
      {
        url: `${baseUrl}${brandConfig.assets.logoStackedUrl}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.name} NFC Business Card`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `NFC Business Card — Smart Contactless Tap Cards | ${brandConfig.name}`,
    description: `Premium metal and matte NFC business cards. Tap to share contacts instantly.`,
  },
};

export default function NfcBusinessCardPage() {
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${brandConfig.name} NFC Smart Business Card`,
    description:
      'High-grade contactless NFC smart business cards featuring NTAG216 high-frequency microchips, custom laser engraving, and dynamic QR backup.',
    brand: {
      '@type': 'Brand',
      name: brandConfig.name,
    },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '499',
      highPrice: '3999',
      priceCurrency: 'INR',
      offerCount: '4',
    },
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
        name: 'NFC Business Card',
        item: `${baseUrl}/nfc-business-card`,
      },
    ],
  };

  const materials = [
    {
      name: 'Executive Matte PVC',
      badge: 'Popular Choice',
      desc: 'Durable, waterproof, credit-card grade polymer with silky matte touch and high-definition thermal printing.',
      specs: '0.84mm standard thickness | Scratch-resistant | Full-bleed color',
    },
    {
      name: 'Brushed Metal & Steel',
      badge: 'Signature Luxury',
      desc: 'Precision laser-cut stainless steel core featuring an integrated ferrite shielding layer for uninhibited NFC transmission.',
      specs: '1.2mm weighted feel | Laser precision engraving | Matte black / Gold / Silver',
    },
    {
      name: 'Natural Bamboo & Walnut',
      badge: 'Eco-Friendly',
      desc: 'Sustainably sourced organic hardwoods embedded with ultra-thin NFC microcoils, combining warmth with modern tech.',
      specs: '100% biodegradable wood body | Laser-etched finish | Lightweight',
    },
  ];

  const techFeatures = [
    {
      icon: Cpu,
      title: 'Genuine NXP NTAG216 Chips',
      desc: 'Industry-standard 888-byte memory with 100,000 read/write endurance and 10-year data retention for flawless edge tapping.',
    },
    {
      icon: Zap,
      title: 'Anti-Metal Ferrite Shielding',
      desc: 'Specialized magnetic absorption layer prevents interference, ensuring instantaneous reads on all metal phone bodies and cardholders.',
    },
    {
      icon: Smartphone,
      title: 'Universal iPhone & Android Reach',
      desc: 'Native background NFC tag detection on iOS (iPhone XR to 16 Pro) and all Android NFC smartphones without installing any third-party app.',
    },
    {
      icon: QrCode,
      title: 'Dynamic QR Code Backup',
      desc: 'Every card features a high-density, vector-rendered dynamic QR code on the reverse side for instant compatibility with older devices.',
    },
    {
      icon: RefreshCw,
      title: 'Real-Time Remote Updates',
      desc: 'Update your phone number, portfolio, company, or links at any time from your dashboard without ever replacing your physical card.',
    },
    {
      icon: ShieldCheck,
      title: 'Bank-Grade Privacy & Protection',
      desc: 'Zero sensitive data stored unencrypted on chip. Cards redirect through dynamic, secure shortlinks protected against cloning.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Hero Section */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-3xl space-y-6 text-left">
          <Badge variant="brand" className="text-xs px-2.5 py-1 font-medium bg-blue-50 text-blue-700 border-blue-100">
            Next-Gen Contactless Networking
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] text-foreground leading-[1.08]">
            The smart NFC business card that makes an unforgettable impression.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            One tap against any smartphone instantly shares your verified digital profile, phonebook vCard, portfolio, and active businesses. Never print paper cards again.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6">
                Create Your Card <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="font-medium px-6">
                View Pricing & Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Hardware Specifications & Engineering */}
      <section className="border-t border-border/60 bg-muted/20 py-20">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Engineered for Instantaneous Reads
            </h2>
            <p className="text-muted-foreground">
              Tuned antenna geometry and high-permeability ferrite layers guarantee sub-50 millisecond tap recognition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {techFeatures.map((feat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-border/80 bg-card/60 hover:border-border transition-colors space-y-3"
              >
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <feat.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Material Finishes */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Crafted in Three Premium Finishes
            </h2>
            <p className="text-muted-foreground">
              Choose the tactile aesthetic that reflects your executive standard and brand identity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {materials.map((mat, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border p-8 bg-card flex flex-col justify-between space-y-6 hover:shadow-lg transition-shadow"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                      {mat.badge}
                    </span>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{mat.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{mat.desc}</p>
                </div>
                <div className="pt-4 border-t border-border/60">
                  <p className="text-xs font-mono text-muted-foreground">{mat.specs}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/60 bg-blue-600 py-16 text-white text-center">
        <div className="container mx-auto max-w-4xl px-4 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Ready to upgrade from wasteful paper cards?
          </h2>
          <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto">
            Join thousands of founders, directors, and executives networking with {brandConfig.name}.
          </p>
          <div className="pt-2">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-8">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
