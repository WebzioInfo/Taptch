import type { Metadata } from 'next';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin, Building2, Send, Clock } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';

export const metadata: Metadata = {
  title: `Contact Us — Sales, Bulk Orders & Support`,
  description: `Get in touch with the ${brandConfig.name} team for corporate orders, custom laser-engraved metal NFC cards, enterprise onboarding, or general support.`,
  alternates: {
    canonical: `${baseUrl}/contact`,
  },
  openGraph: {
    title: `Contact Us | ${brandConfig.name}`,
    description: `Connect with our sales and technical support teams. We respond within 24 hours.`,
    url: `${baseUrl}/contact`,
    siteName: brandConfig.name,
    images: [
      {
        url: `${baseUrl}${brandConfig.assets.logoStackedUrl}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.name} Contact`,
      },
    ],
  },
};

export default function ContactPage() {
  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${brandConfig.name}`,
    description:
      'Contact channels for customer support, corporate bulk card inquiries, and enterprise onboarding.',
    mainEntity: {
      '@type': 'ContactPoint',
      email: brandConfig.supportEmail,
      contactType: 'customer support',
      availableLanguage: ['en', 'hi'],
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />

      {/* Header */}
      <section className="container mx-auto max-w-4xl px-4 sm:px-6 pt-16 pb-12 text-center">
        <Badge variant="brand" className="text-xs px-2.5 py-1 font-medium bg-blue-50 text-blue-700 border-blue-100 mb-4">
          Direct Channels
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
          Let’s start a conversation
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
          Whether you need 5 custom metal cards for your executive board or 5,000 cards for a global team, we’re ready to assist.
        </p>
      </section>

      {/* Contact Grid */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Left Column: Direct Info */}
          <div className="md:col-span-5 space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">How can we help?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Reach out for custom Pantone color matching, enterprise bulk discounts, API integration, or technical support.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Support</p>
                  <a
                    href={`mailto:${brandConfig.supportEmail}`}
                    className="text-sm font-medium text-foreground hover:text-blue-600 transition-colors"
                  >
                    {brandConfig.supportEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response Time</p>
                  <p className="text-sm text-foreground">Within 24 business hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Corporate Entity</p>
                  <p className="text-sm text-foreground">{brandConfig.legalName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Inquiry Form */}
          <div className="md:col-span-7 p-8 rounded-2xl border border-border bg-card shadow-xs">
            <h3 className="text-xl font-semibold text-foreground mb-6">Send an inquiry</h3>
            <form
              action="mailto:support@taptch.com"
              method="GET"
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Full Name</label>
                  <Input placeholder="John Doe" name="name" required className="bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Work Email</label>
                  <Input type="email" placeholder="john@company.com" name="email" required className="bg-background" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Company Name</label>
                  <Input placeholder="Acme Inc." name="company" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Inquiry Type</label>
                  <select
                    name="subject"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                  >
                    <option value="Corporate Bulk Order">Corporate Bulk Order (10+ Cards)</option>
                    <option value="Custom Metal Card Request">Custom Metal Card Request</option>
                    <option value="Partnership / Reseller">Partnership / Reseller</option>
                    <option value="General Support">General Support</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Message</label>
                <textarea
                  name="body"
                  rows={4}
                  required
                  placeholder="Tell us about your team size, timeline, or question..."
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                />
              </div>

              <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                Submit Inquiry <Send className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

