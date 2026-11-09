import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Check,
  QrCode,
  Smartphone,
  Share2,
  Users,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

export default function HomePage() {
  const plans = [
    {
      id: 'nano',
      name: 'Nano',
      badge: 'Free Forever',
      price: '₹0',
      period: 'forever',
      desc: 'Create your digital profile and start sharing your contact details.',
      features: [
        '1 Digital Profile',
        'Standard profile style',
        'Instant vCard download',
        'Direct profile QR code',
        'Unlimited profile views',
      ],
      highlighted: false,
    },
    {
      id: 'micro',
      name: 'Micro',
      badge: 'Solo Professional',
      price: '₹499',
      period: '/year',
      desc: 'Ideal for independent consultants and solo professionals.',
      features: [
        '2 Digital Profiles',
        '1 Linked Business Profile',
        'Company overview and bio',
        'Contact exchange form',
        'Photo gallery (5 images)',
        'Map location integration',
      ],
      highlighted: false,
    },
    {
      id: 'mini',
      name: 'Mini',
      badge: 'Most Popular',
      price: '₹1,499',
      period: '/year',
      desc: 'Designed for small business owners and growing practices.',
      features: [
        '5 Digital Profiles',
        'Up to 3 Linked Business Profiles',
        'Catalogue showcase (10 items)',
        'Photo gallery (15 images)',
        'Premium profile styles',
        'Lead capture & export',
      ],
      highlighted: true,
    },
    {
      id: 'max',
      name: 'Max',
      badge: 'Multi-Brand & Team',
      price: '₹3,999',
      period: '/year',
      desc: 'For multi-brand founders, directors, and enterprise teams.',
      features: [
        '20 Digital Profiles',
        'Up to 10 Distinct Businesses',
        'Complete product and service catalogue',
        'Brochure and document downloads',
        'Video integration',
        'Custom domain support',
        'All profile styles unlocked',
      ],
      highlighted: false,
    },
  ];

  const faqs = [
    {
      q: 'How does someone save my profile?',
      a: 'When a visitor opens your profile, they click "Save this profile". This immediately downloads a standard vCard (.vcf) file directly into their phone contacts without requiring any app install.',
    },
    {
      q: 'Do recipients need an app to view my profile?',
      a: 'No. TAPTCH profiles are instant web pages that open seamlessly in any browser when tapped via NFC or scanned via QR code.',
    },
    {
      q: 'Can I connect a physical NFC card to my digital profile?',
      a: 'Yes. You can link any compatible NFC card or standee directly to your profile link or dynamic QR code in seconds.',
    },
    {
      q: 'Can I update my details after creating or printing?',
      a: 'Yes. Your contact information, business details, and links update instantly in real time without needing to reprint cards or QR codes.',
    },
  ];

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${brandConfig.name} Digital Business Card & Identity Platform`,
    operatingSystem: 'Any (Web, iOS, Android)',
    applicationCategory: 'BusinessApplication',
    url: siteUrl,
    offers: [
      {
        '@type': 'Offer',
        name: 'Nano',
        price: '0',
        priceCurrency: 'INR',
        description: 'Free forever digital business card with standard theme and vCard download.',
      },
      {
        '@type': 'Offer',
        name: 'Micro',
        price: '499',
        priceCurrency: 'INR',
        description: 'Annual solo professional plan with 1 linked business profile and gallery.',
      },
      {
        '@type': 'Offer',
        name: 'Mini',
        price: '1499',
        priceCurrency: 'INR',
        description: 'Most popular growing business plan with 5 profiles, catalogues, and lead capture.',
      },
      {
        '@type': 'Offer',
        name: 'Max',
        price: '3999',
        priceCurrency: 'INR',
        description: 'Multi-brand executive and enterprise plan with 20 profiles and custom domains.',
      },
    ],
  };

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

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo variant="horizontal" size="md" asLink href="/" />

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#business" className="hover:text-slate-900 transition-colors">For Business</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-900">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Create Profile
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          {/* Left Column: Clear Value Proposition */}
          <div className="md:col-span-7 space-y-6 text-left">
            <Badge variant="brand" className="text-xs px-2.5 py-1 font-medium bg-blue-50 text-blue-700 border-blue-100">
              Professional Digital Identity
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] text-slate-950 leading-[1.08]">
              Your professional identity, one link.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed font-normal">
              Create a digital profile that makes it easy to share your details, connect with people and grow your network.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link href="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2 w-full sm:w-auto">
                  <span>Create your profile</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/templates">
                <Button variant="outline" size="lg" className="border-slate-300 text-slate-800 hover:bg-slate-50 font-medium w-full sm:w-auto">
                  Explore profiles
                </Button>
              </Link>
            </div>

            <div className="pt-4 flex items-center gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-blue-600" />
                <span>Instant contact saving (vCard)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-blue-600" />
                <span>Works on all smartphones</span>
              </div>
            </div>
          </div>

          {/* Right Column: Realistic Clean Profile Preview */}
          <div className="md:col-span-5 flex justify-center">
            <div className="w-full max-w-[340px] rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden text-left">
              <div className="h-28 bg-gradient-to-r from-blue-600 to-blue-700 relative p-4 flex justify-between items-start">
                <span className="text-[11px] font-semibold tracking-wider text-blue-100 uppercase">
                  Verified Identity
                </span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white">
                  Active
                </span>
              </div>

              <div className="px-6 pb-6 pt-0 relative -mt-10 space-y-4">
                <div className="flex items-end justify-between">
                  <div className="h-20 w-20 rounded-full border-4 border-white bg-slate-100 shadow-sm flex items-center justify-center font-bold text-2xl text-blue-600">
                    AD
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center text-xs font-semibold text-blue-600">
                      taptch.com/p/aditya
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">Aditya Sharma</h3>
                  <p className="text-xs text-slate-600 font-medium">Founder & Managing Director</p>
                  <p className="text-xs text-slate-500">Apex Capital Partners</p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="w-full rounded-md bg-blue-600 text-white text-xs font-semibold py-2.5 text-center shadow-xs">
                    Save this profile
                  </div>
                  <div className="w-full rounded-md border border-slate-200 text-slate-700 text-xs font-medium py-2 text-center hover:bg-slate-50">
                    Exchange contact
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                    NFC Enabled
                  </span>
                  <span className="flex items-center gap-1">
                    <QrCode className="h-3.5 w-3.5 text-blue-600" />
                    Dynamic QR
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How TAPTCH Works */}
      <section id="how-it-works" className="border-t border-slate-200 bg-slate-50/60 py-20">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-xl mx-auto text-center space-y-2 mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950">
              How TAPTCH works
            </h2>
            <p className="text-sm text-slate-600">
              Simple steps to establish and share your professional presence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-3">
              <div className="h-10 w-10 rounded-md bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Build your profile</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add your professional details, contact info, social handles, and business catalogue in minutes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-3">
              <div className="h-10 w-10 rounded-md bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Share with anyone</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tap via physical NFC card, scan your dynamic QR code, or share your personalized profile link.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-3">
              <div className="h-10 w-10 rounded-md bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Instant contact save</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Visitors click "Save this profile" to download a clean vCard directly to their contacts without installing any app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features */}
      <section id="features" className="container mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <div className="max-w-xl mx-auto text-center space-y-2 mb-14">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-slate-950">
            Engineered for modern professionals
          </h2>
          <p className="text-sm text-slate-600">
            Everything you need to present your business and make meaningful connections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-lg border border-slate-200 space-y-3">
            <Share2 className="h-6 w-6 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-base">Share through NFC & QR</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Use physical smart cards, counter standees, or digital QR codes. All links route instantly to your live profile.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-slate-200 space-y-3">
            <Users className="h-6 w-6 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-base">Two-way contact exchange</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Allow clients and partners to send their details back to you directly through a built-in exchange form.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-slate-200 space-y-3">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-base">Real-time profile updates</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Update phone numbers, job titles, links, and products anytime. Your printed cards and QR codes always point to current data.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-slate-200 space-y-3">
            <Smartphone className="h-6 w-6 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-base">Zero installation barrier</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Runs as a fast, responsive web application. No app store downloads or sign-ups required for visitors to view or save.
            </p>
          </div>
        </div>
      </section>

      {/* 5. For Business & Teams */}
      <section id="business" className="border-t border-slate-200 bg-slate-50/60 py-20">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-6 space-y-4">
              <Badge variant="brand" className="text-xs">Business & Teams</Badge>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-slate-950">
                Manage your team's digital presence
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Provide unified digital profiles for your executives, sales force, and employees. Control company branding, track engagement, and capture inbound business leads.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  <span>Centralized team roster and profile management</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  <span>Consistent corporate identity across all profiles</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  <span>Inbound lead collection and contact exports</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link href="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                    Set up your team
                  </Button>
                </Link>
              </div>
            </div>

            <div className="md:col-span-6 bg-white p-6 rounded-lg border border-slate-200 space-y-4">
              <div className="text-xs font-semibold text-slate-900 border-b border-slate-100 pb-3">
                Team Overview Preview
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-md bg-slate-50 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">Aditya Sharma</span>
                    <span className="text-slate-500 block text-[11px]">Managing Director</span>
                  </div>
                  <span className="text-blue-600 font-mono text-[11px]">taptch.com/p/aditya</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-slate-50 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">Pooja Patel</span>
                    <span className="text-slate-500 block text-[11px]">Head of Client Relations</span>
                  </div>
                  <span className="text-blue-600 font-mono text-[11px]">taptch.com/p/pooja</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-slate-50 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">Karan Mehta</span>
                    <span className="text-slate-500 block text-[11px]">Senior Associate</span>
                  </div>
                  <span className="text-blue-600 font-mono text-[11px]">taptch.com/p/karan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing Section */}
      <section id="pricing" className="container mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <div className="max-w-xl mx-auto text-center space-y-2 mb-14">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-slate-950">
            Simple, transparent pricing
          </h2>
          <p className="text-sm text-slate-600">
            Choose the plan that fits your professional or organization goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`rounded-lg border p-6 flex flex-col justify-between transition-all ${
                p.highlighted
                  ? 'border-blue-600 ring-1 ring-blue-600 bg-white shadow-md'
                  : 'border-slate-200 bg-white shadow-xs'
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg tracking-tight">{p.name}</h3>
                    <p className="text-[11px] text-slate-500">{p.badge}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-3xl font-semibold font-mono tracking-tight text-slate-950">{p.price}</span>
                  <span className="text-xs text-slate-500 ml-1">{p.period}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                  {p.desc}
                </p>

                <div className="pt-4 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-800 mb-2">What's included:</div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6">
                <Link href="/register">
                  <Button
                    variant={p.highlighted ? 'default' : 'outline'}
                    className={`w-full text-xs font-semibold ${
                      p.highlighted ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-slate-300 text-slate-800'
                    }`}
                  >
                    Select {p.name}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section id="faq" className="border-t border-slate-200 bg-slate-50/60 py-20">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950">
              Frequently asked questions
            </h2>
            <p className="text-sm text-slate-600">
              Clear answers to common questions about TAPTCH.
            </p>
          </div>

          <div className="divide-y divide-slate-200 bg-white rounded-lg border border-slate-200">
            {faqs.map((f, i) => (
              <div key={i} className="p-6 space-y-2">
                <h3 className="font-semibold text-slate-900 text-sm">{f.q}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Final CTA Section */}
      <section className="container mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 sm:p-14 space-y-4 shadow-sm">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-950 tracking-tight">
            Create your profile in minutes.
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Your identity. One simple link. Keep your contact information updated and easy to share.
          </p>
          <div className="pt-4 flex justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2">
                <span>Create your profile</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Minimal Clean Footer */}
      <footer className="w-full border-t border-slate-200 py-10 bg-white text-xs text-slate-500">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <BrandLogo variant="symbol" size="sm" />
            <span className="font-semibold text-slate-900">{brandConfig.name}</span>
            <span>•</span>
            <span>{brandConfig.tagline}</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/templates" className="hover:text-slate-900">Templates</Link>
            <Link href="/login" className="hover:text-slate-900">Sign In</Link>
            <Link href="/register" className="hover:text-slate-900">Create Profile</Link>
          </div>

          <div>
            &copy; {new Date().getFullYear()} {brandConfig.legalName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
