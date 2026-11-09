import type { Metadata } from 'next';
import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Share2,
  Users,
  Briefcase,
  BarChart3,
  Globe,
  Palette,
  QrCode,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
} from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';

export const metadata: Metadata = {
  title: `Platform Features — Dynamic Identity & Contactless Networking`,
  description: `Explore ${brandConfig.name} platform features: instant vCard downloads, multi-business association, dynamic QR codes, lead capture, and privacy-first analytics.`,
  alternates: {
    canonical: `${baseUrl}/features`,
  },
  openGraph: {
    title: `Platform Features | ${brandConfig.name}`,
    description: `Enterprise-grade digital business card and NFC networking suite.`,
    url: `${baseUrl}/features`,
    siteName: brandConfig.name,
    images: [
      {
        url: `${baseUrl}${brandConfig.assets.logoStackedUrl}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.name} Features`,
      },
    ],
  },
};

export default function FeaturesPage() {
  const featureList = [
    {
      icon: Download,
      title: 'Instant Native vCard Download',
      category: 'Core Contact Sharing',
      desc: 'One tap allows prospects to save your full contact card (.vcf) directly into their phonebook without typing a single digit or installing an app.',
    },
    {
      icon: Briefcase,
      title: 'Multi-Business Showcase Architecture',
      category: 'Executive Identity',
      desc: 'Link up to 10 distinct businesses to your personal profile. Switch effortlessly between presenting as a founder, consultant, or advisor.',
    },
    {
      icon: Users,
      title: 'Two-Way Contact Exchange & Lead Form',
      category: 'Lead Generation',
      desc: 'Turn casual networking into qualified leads. Recipients submit their details back to you in seconds, stored neatly in your dashboard with CSV export.',
    },
    {
      icon: Palette,
      title: 'Obsidian Luxury & Responsive Themes',
      category: 'Design Systems',
      desc: 'Carefully calibrated color swatches, typography scales, and micro-interactions designed to convey executive authority on any screen size.',
    },
    {
      icon: QrCode,
      title: 'Dynamic High-Density QR Codes',
      category: 'Connectivity',
      desc: 'Vector-rendered dynamic QR codes that always stay up to date. Download in print-ready SVG or PNG for brochures, standees, and badges.',
    },
    {
      icon: BarChart3,
      title: 'Privacy-Safe Engagement Analytics',
      category: 'Intelligence',
      desc: 'Observe profile taps, vCard downloads, and link interactions in real time. We hash visitor IPs using rotating salts to ensure total DPDP Act compliance.',
    },
    {
      icon: Globe,
      title: 'Custom Domain & Subdomain Mapping',
      category: 'Branding',
      desc: 'Host your card on your own company domain (e.g., card.yourbrand.com) with automatic SSL provisioning for seamless enterprise credibility.',
    },
    {
      icon: ShieldCheck,
      title: 'Zero Dynamic Hot Path & 99.9% Uptime',
      category: 'Infrastructure',
      desc: 'Edge-cached precompiled JSON snapshots guarantee sub-50ms profile delivery even during massive networking events and conferences.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-16 text-center">
        <Badge variant="brand" className="text-xs px-2.5 py-1 font-medium bg-blue-50 text-blue-700 border-blue-100 mb-4">
          Feature Deep Dive
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground max-w-3xl mx-auto">
          Every tool you need to network, share, and close deals effortlessly
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
          From hardware-level anti-metal shielding to serverless edge profile rendering, discover how {brandConfig.name} powers executive connections.
        </p>
      </section>

      {/* Feature Grid */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureList.map((f, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-border bg-card flex flex-col justify-between hover:border-slate-400 transition-colors"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {f.category}
                  </span>
                  <h3 className="text-base font-semibold text-foreground mt-1">{f.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 bg-muted/20 py-16 text-center">
        <div className="container mx-auto max-w-3xl px-4 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Experience the future of business networking
          </h2>
          <p className="text-sm text-muted-foreground">
            Get started today on our free plan or explore all luxury templates.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6">
                Create Free Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

