import type { Metadata } from 'next';
import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';

export const metadata: Metadata = {
  title: `Pricing & Plans — Transparent Digital Card Subscriptions`,
  description: `Start free with Nano forever. Upgrade to Micro (₹499/yr), Mini (₹1,499/yr), or Max (₹3,999/yr) for multiple business profiles, lead capture, and custom domains.`,
  alternates: {
    canonical: `${baseUrl}/pricing`,
  },
  openGraph: {
    title: `Pricing & Plans | ${brandConfig.name}`,
    description: `Transparent pricing for professionals, consultants, and multi-brand founders. From ₹0 to ₹3,999/yr.`,
    url: `${baseUrl}/pricing`,
    siteName: brandConfig.name,
    images: [
      {
        url: `${baseUrl}${brandConfig.assets.logoStackedUrl}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.name} Pricing`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Pricing & Plans | ${brandConfig.name}`,
    description: `Choose the digital identity tier that scales with your business ventures.`,
  },
};

export default function PricingPage() {
  const plans = [
    {
      id: 'nano',
      name: 'Nano',
      badge: 'Free Forever',
      price: '₹0',
      period: 'forever',
      desc: 'Create your digital profile and start sharing your contact details instantly.',
      features: [
        '1 Digital Profile',
        'Standard profile style',
        'Instant vCard download (.vcf)',
        'Direct profile dynamic QR code',
        'Unlimited profile views',
        'Standard community support',
      ],
      highlighted: false,
      cta: 'Get Started Free',
    },
    {
      id: 'micro',
      name: 'Micro',
      badge: 'Solo Professional',
      price: '₹499',
      period: '/year',
      desc: 'Ideal for independent consultants, realtors, and solo service providers.',
      features: [
        '2 Digital Profiles',
        '1 Linked Business Profile',
        'Company overview & rich bio',
        'Contact exchange lead form',
        'Photo gallery (5 images)',
        'Map location integration',
        'Email customer support',
      ],
      highlighted: false,
      cta: 'Choose Micro',
    },
    {
      id: 'mini',
      name: 'Mini',
      badge: 'Most Popular',
      price: '₹1,499',
      period: '/year',
      desc: 'Designed for small business owners, agencies, and growing practices.',
      features: [
        '5 Digital Profiles',
        'Up to 3 Linked Business Profiles',
        'Catalogue showcase (10 items)',
        'Photo gallery (15 images)',
        'Premium Obsidian profile styles',
        'Lead capture & CSV export',
        'Detailed visit analytics',
      ],
      highlighted: true,
      cta: 'Choose Mini',
    },
    {
      id: 'max',
      name: 'Max',
      badge: 'Multi-Brand & Team',
      price: '₹3,999',
      period: '/year',
      desc: 'For multi-brand founders, corporate directors, and enterprise teams.',
      features: [
        '20 Digital Profiles',
        'Up to 10 Distinct Businesses',
        'Complete product & service catalogue',
        'Brochure & PDF document downloads',
        'Video showcase integration',
        'Custom domain support',
        'All profile styles unlocked',
        'Priority executive support',
      ],
      highlighted: false,
      cta: 'Choose Max',
    },
  ];

  const pricingFaqs = [
    {
      q: 'Is the Nano plan really free forever?',
      a: 'Yes. The Nano plan includes 1 full digital profile with standard themes, unlimited profile views, and instant vCard phonebook downloads at zero cost.',
    },
    {
      q: 'Do plans include physical NFC cards?',
      a: 'Digital identity subscription plans cover the cloud profile hosting, dynamic redirects, and lead capture software. Physical NFC cards (matte PVC, bamboo, or stainless steel) can be ordered separately or bundled directly from your dashboard.',
    },
    {
      q: 'Can I upgrade or downgrade later?',
      a: 'Yes. You can upgrade your plan at any time. When upgrading, your existing data, templates, and dynamic QR links remain 100% intact without disruption.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We support UPI, Net Banking, credit/debit cards, and corporate bank transfers across India.',
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pricingFaqs.map((f) => ({
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
        name: 'Pricing',
        item: `${baseUrl}/pricing`,
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
      <section className="container mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-12 text-center">
        <Badge variant="brand" className="text-xs px-2.5 py-1 font-medium bg-blue-50 text-blue-700 border-blue-100 mb-4">
          Transparent Pricing
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
          Predictable plans for every stage of your growth
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
          No hidden fees. No forced branding on paid tiers. Choose the plan tailored to your profile count and business ventures.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                p.highlighted
                  ? 'border-blue-600 shadow-xl bg-card ring-1 ring-blue-600'
                  : 'border-border bg-card hover:border-slate-400'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-foreground">
                    {p.badge}
                  </span>
                  {p.highlighted && (
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      Recommended
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground">{p.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-foreground">{p.price}</span>
                    <span className="text-xs text-muted-foreground">{p.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{p.desc}</p>
                </div>

                <div className="pt-4 border-t border-border/60 space-y-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What’s included</p>
                  <ul className="space-y-2">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start text-xs text-muted-foreground">
                        <Check className="h-4 w-4 text-blue-600 shrink-0 mr-2" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6">
                <Link href="/register">
                  <Button
                    className={`w-full text-xs font-medium ${
                      p.highlighted
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    {p.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing FAQs */}
      <section className="border-t border-border/60 bg-muted/20 py-20">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Frequently Asked Questions</h2>
            <p className="text-muted-foreground mt-2 text-sm">Everything you need to know about plans and billing.</p>
          </div>

          <div className="space-y-6">
            {pricingFaqs.map((faq, idx) => (
              <div key={idx} className="p-6 rounded-xl border border-border/80 bg-card">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  {faq.q}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

