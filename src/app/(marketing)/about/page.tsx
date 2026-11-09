import type { Metadata } from 'next';
import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Leaf, Sparkles, Zap, ArrowRight } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';

export const metadata: Metadata = {
  title: `About Us — Modern Identity Engineering`,
  description: `Learn about ${brandConfig.name} and ${brandConfig.legalName}. We are on a mission to replace billions of wasteful paper cards with intelligent NFC and digital business cards.`,
  alternates: {
    canonical: `${baseUrl}/about`,
  },
  openGraph: {
    title: `About Us | ${brandConfig.name}`,
    description: `The mission and engineering principles behind ${brandConfig.name} digital identity platform.`,
    url: `${baseUrl}/about`,
    siteName: brandConfig.name,
    images: [
      {
        url: `${baseUrl}${brandConfig.assets.logoStackedUrl}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.name} About Us`,
      },
    ],
  },
};

export default function AboutPage() {
  const values = [
    {
      icon: Sparkles,
      title: 'Obsidian Design Excellence',
      desc: 'We reject cookie-cutter templates. Every profile theme, micro-interaction, and physical card finish is engineered to radiate executive authority.',
    },
    {
      icon: Leaf,
      title: 'Environmental Sustainability',
      desc: 'Over 88% of paper business cards are tossed in the trash within a week. One digital NFC card lasts for years, eliminating thousands of wasted paper prints.',
    },
    {
      icon: ShieldCheck,
      title: 'Privacy by Architecture',
      desc: 'We honor data sovereignty under India’s DPDP Act. We never monetize personal contact data, track raw IP addresses, or inject third-party ad pixels.',
    },
    {
      icon: Zap,
      title: 'Sub-50ms Edge Performance',
      desc: 'Networking happens in fast-paced real-world environments. Our precompiled JSON snapshot engine delivers your card faster than pulling out a wallet.',
    },
  ];

  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${brandConfig.name}`,
    description:
      'Learn about the mission, engineering philosophy, and sustainability goals behind Taptch contactless digital identity platform.',
    publisher: {
      '@type': 'Organization',
      name: brandConfig.legalName,
      url: baseUrl,
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      {/* Hero */}
      <section className="container mx-auto max-w-4xl px-4 sm:px-6 pt-16 pb-16 text-center">
        <Badge variant="brand" className="text-xs px-2.5 py-1 font-medium bg-blue-50 text-blue-700 border-blue-100 mb-4">
          Our Mission
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
          Reinventing how the world connects in real life
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4 leading-relaxed">
          {brandConfig.name} was built by {brandConfig.legalName} to bridge physical human encounters with powerful digital identity.
        </p>
      </section>

      {/* Philosophy */}
      <section className="container mx-auto max-w-4xl px-4 sm:px-6 pb-20">
        <div className="prose prose-slate max-w-none text-muted-foreground leading-relaxed space-y-6">
          <p className="text-base sm:text-lg">
            For decades, the humble paper business card was the gold standard of professional introduction. But paper cards are fundamentally flawed: they run out, their information becomes obsolete the moment you change roles or numbers, and the recipient must manually type your phone number or scan a photo.
          </p>
          <p className="text-base sm:text-lg">
            At {brandConfig.name}, we engineered a better way. Combining near-field communication (NFC) hardware with a high-speed, serverless cloud platform, we allow you to share your phonebook contact (.vcf), company profile, portfolio, catalogue, and ventures in a single tap.
          </p>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
          {values.map((val, idx) => (
            <div key={idx} className="p-6 rounded-xl border border-border bg-card space-y-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <val.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{val.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{val.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 bg-muted/20 py-16 text-center">
        <div className="container mx-auto max-w-3xl px-4 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Join the modern networking movement
          </h2>
          <p className="text-sm text-muted-foreground">
            Start sharing your verified digital business card today.
          </p>
          <div className="pt-2">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8">
                Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
