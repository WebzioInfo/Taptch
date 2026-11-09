import type { Metadata } from 'next';
import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  Download,
  Share2,
  Users,
  BarChart3,
  Briefcase,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  Globe,
  Sparkles,
} from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';

export const metadata: Metadata = {
  title: `Digital Business Card — Instant Virtual Profiles & vCard`,
  description: `Create an interactive digital business card in 60 seconds. Share contact info, portfolios, social links, and multiple business profiles. Zero app required.`,
  alternates: {
    canonical: `${baseUrl}/digital-business-card`,
  },
  openGraph: {
    title: `Digital Business Card — Instant Virtual Profiles & vCard | ${brandConfig.name}`,
    description: `The smart digital business card and virtual profile builder. Download vCard contacts directly into any smartphone phonebook.`,
    url: `${baseUrl}/digital-business-card`,
    siteName: brandConfig.name,
    images: [
      {
        url: `${baseUrl}${brandConfig.assets.logoStackedUrl}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.name} Digital Business Card`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Digital Business Card — Instant Virtual Profiles & vCard | ${brandConfig.name}`,
    description: `Smart digital business cards with direct vCard phonebook integration.`,
  },
};

export default function DigitalBusinessCardPage() {
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${brandConfig.name} Digital Business Card`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All Modern Web Browsers (iOS, Android, macOS, Windows)',
    description:
      'Professional digital business card platform enabling real-time contact sharing, instant vCard downloading, dynamic QR codes, and multi-business profiles.',
    url: `${baseUrl}/digital-business-card`,
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
        name: 'Digital Business Card',
        item: `${baseUrl}/digital-business-card`,
      },
    ],
  };

  const benefits = [
    {
      icon: Download,
      title: 'One-Click Direct vCard Download',
      desc: 'When clients view your profile, tapping "Save Contact" immediately transfers your full contact card (.vcf) directly into their native iPhone Contacts or Google Contacts.',
    },
    {
      icon: Briefcase,
      title: 'Multi-Business Identity Architecture',
      desc: 'Run a consultancy, a tech startup, and a retail brand? Showcase multiple businesses under your single master profile without maintaining separate cards.',
    },
    {
      icon: Share2,
      title: 'Zero App Installation Needed',
      desc: 'Recipients do not need to install any app or register an account. Your profile opens instantly in their mobile browser with sub-second rendering.',
    },
    {
      icon: Users,
      title: 'Bidirectional Contact Exchange & Lead Capture',
      desc: 'Allow prospective clients to send their name, email, phone, and inquiry note back to you with one tap. Leads sync directly into your dashboard.',
    },
    {
      icon: BarChart3,
      title: 'Real-Time Engagement Analytics',
      desc: 'Track link clicks, vCard downloads, profile visits, and location metrics with privacy-preserving, GDPR/DPDP-compliant analytics.',
    },
    {
      icon: Globe,
      title: 'Custom Subdomains & Vanity Links',
      desc: 'Publish your card under clean URLs like taptch.com/p/yourname or link your own custom domain for executive branding.',
    },
  ];

  const comparison = [
    {
      feature: 'Instant Phonebook (.vcf) Save',
      paper: false,
      genericBio: false,
      taptch: true,
    },
    {
      feature: 'Real-Time Info Updates (No Reprints)',
      paper: false,
      genericBio: true,
      taptch: true,
    },
    {
      feature: 'Multiple Business Profiles in One Card',
      paper: false,
      genericBio: false,
      taptch: true,
    },
    {
      feature: 'Lead Capture & Contact Exchange Form',
      paper: false,
      genericBio: false,
      taptch: true,
    },
    {
      feature: 'Sub-50ms Edge Response Time',
      paper: false,
      genericBio: false,
      taptch: true,
    },
    {
      feature: 'Executive Obsidian Luxury Themes',
      paper: false,
      genericBio: false,
      taptch: true,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Hero Section */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-3xl space-y-6 text-left">
          <Badge variant="brand" className="text-xs px-2.5 py-1 font-medium bg-blue-50 text-blue-700 border-blue-100">
            Professional Virtual Identity
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] text-foreground leading-[1.08]">
            Your entire professional identity, in one elegant link.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Replace static paper cards with an interactive digital profile that puts your phone number, social channels, product catalogues, and ventures directly into your prospect’s pocket.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6">
                Create Free Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/templates">
              <Button size="lg" variant="outline" className="font-medium px-6">
                Explore Templates
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="border-t border-border/60 bg-muted/20 py-20">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Everything You Need to Network at the Highest Level
            </h2>
            <p className="text-muted-foreground">
              Designed from the ground up for modern founders, consultants, and commercial leaders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-border/80 bg-card/60 hover:border-border transition-colors space-y-3"
              >
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Why Leaders Switch to {brandConfig.name}
            </h2>
            <p className="text-muted-foreground">
              See how our digital identity platform compares to traditional and basic solutions.
            </p>
          </div>

          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="grid grid-cols-12 bg-muted/50 p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <div className="col-span-6">Capability</div>
              <div className="col-span-2 text-center">Paper Cards</div>
              <div className="col-span-2 text-center">Basic Link-in-Bio</div>
              <div className="col-span-2 text-center text-blue-600">{brandConfig.name}</div>
            </div>

            <div className="divide-y divide-border/60">
              {comparison.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 p-4 items-center text-sm">
                  <div className="col-span-6 font-medium text-foreground">{row.feature}</div>
                  <div className="col-span-2 flex justify-center">
                    {row.paper ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-slate-300" />}
                  </div>
                  <div className="col-span-2 flex justify-center">
                    {row.genericBio ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-slate-300" />}
                  </div>
                  <div className="col-span-2 flex justify-center">
                    {row.taptch ? <Check className="h-5 w-5 text-blue-600 font-bold" /> : <X className="h-4 w-4 text-slate-300" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/60 bg-slate-900 py-16 text-white text-center">
        <div className="container mx-auto max-w-4xl px-4 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Claim your digital business card in 60 seconds
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
            Start free on the Nano plan. Upgrade whenever you need multiple business profiles or catalogue displays.
          </p>
          <div className="pt-2">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8">
                Create Free Profile Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

