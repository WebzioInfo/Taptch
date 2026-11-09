import type { Metadata } from 'next';
import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, QrCode, Download, ArrowRight, CheckCircle2, Sparkles, Layers } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';

export const metadata: Metadata = {
  title: `How It Works — 3 Simple Steps to Contactless Networking`,
  description: `Learn how ${brandConfig.name} NFC business cards and digital profiles work. Tap any phone, share verified details, and save directly to phonebook contacts with no app required.`,
  alternates: {
    canonical: `${baseUrl}/how-it-works`,
  },
  openGraph: {
    title: `How It Works | ${brandConfig.name}`,
    description: `See how easy it is to share your contact details and business ventures in one instant tap.`,
    url: `${baseUrl}/how-it-works`,
    siteName: brandConfig.name,
    images: [
      {
        url: `${baseUrl}${brandConfig.assets.logoStackedUrl}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.name} How It Works`,
      },
    ],
  },
};

export default function HowItWorksPage() {
  const steps = [
    {
      step: '01',
      title: 'Build Your Verified Profile',
      desc: 'Set up your digital profile in under 60 seconds. Choose an executive theme, upload your photo, add your phone number, social links, portfolio items, and link multiple business ventures.',
      icon: Layers,
    },
    {
      step: '02',
      title: 'Tap Any Smartphone or Scan QR',
      desc: 'Hold your physical NFC card near any iPhone or Android phone. The built-in NFC sensor reads the encrypted chip and launches your live profile in their browser instantly. For older devices, your dynamic QR code provides an instant fallback.',
      icon: Smartphone,
    },
    {
      step: '03',
      title: 'Instant Save to Phone Contacts',
      desc: 'Your prospect taps "Save Contact". A standard vCard (.vcf) file downloads directly into their native contacts app with your name, job title, phone number, email, and website pre-filled. They can also exchange their details back to you.',
      icon: Download,
    },
  ];

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Use a ${brandConfig.name} NFC Digital Business Card`,
    description:
      'Step-by-step guide to creating your digital identity profile, tapping phones with NFC, and exchanging contact details seamlessly.',
    step: steps.map((s, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: s.title,
      text: s.desc,
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
        name: 'How It Works',
        item: `${baseUrl}/how-it-works`,
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Hero */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-16 text-center">
        <Badge variant="brand" className="text-xs px-2.5 py-1 font-medium bg-blue-50 text-blue-700 border-blue-100 mb-4">
          Seamless User Journey
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground max-w-3xl mx-auto">
          Networking reimagined in three intuitive steps
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
          No apps to download. No awkward typing. Just frictionless, instant connection between your card and their phone.
        </p>
      </section>

      {/* Steps */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 pb-20">
        <div className="space-y-12">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center p-8 rounded-2xl border border-border bg-card shadow-xs"
            >
              <div className="md:col-span-3 flex flex-col items-start justify-center">
                <span className="text-4xl font-extrabold text-blue-600 font-mono">{item.step}</span>
                <div className="mt-3 h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <item.icon className="h-6 w-6" />
                </div>
              </div>

              <div className="md:col-span-9 space-y-3">
                <h3 className="text-2xl font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technical FAQ callout */}
      <section className="border-t border-border/60 bg-muted/20 py-20">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl font-semibold text-foreground">Have questions about compatibility or materials?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Read our in-depth FAQ to learn how {brandConfig.name} works on iPhones, Samsung, Pixel, and other Android devices.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link href="/faq">
              <Button variant="outline" size="lg" className="font-medium">
                Read Full FAQ
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                Create Your Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
