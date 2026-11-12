import React from 'react';
import { Link } from 'react-router-dom';
import { brandConfig } from '../config/brand';
import { Button } from '../components/ui/button';
import { ArrowRight, Sparkles, Shield, Zap, Layers, Smartphone, Check, HelpCircle } from 'lucide-react';

export function HomePage() {
  const plans = [
    {
      id: 'nano',
      name: 'Nano',
      badge: 'Free Forever',
      price: '₹0',
      period: 'forever',
      desc: 'Create your digital profile and start sharing your contact details.',
      features: ['1 Digital Profile', 'Standard profile style', 'Instant vCard download', 'Direct profile QR code'],
    },
    {
      id: 'micro',
      name: 'Micro',
      badge: 'Solo Professional',
      price: '₹499',
      period: '/year',
      desc: 'Ideal for independent consultants and solo professionals.',
      features: ['2 Digital Profiles', '1 Linked Business Profile', 'Contact exchange form', 'Photo gallery (5 images)'],
    },
    {
      id: 'mini',
      name: 'Mini',
      badge: 'Most Popular',
      price: '₹1,499',
      period: '/year',
      desc: 'Designed for small business owners and growing practices.',
      features: ['5 Digital Profiles', '2 Linked Businesses', 'UPI Payment Integration', 'PDF Brochures', 'Custom QR styling'],
      highlighted: true,
    },
    {
      id: 'max',
      name: 'Max',
      badge: 'Enterprise Brand',
      price: '₹2,999',
      period: '/year',
      desc: 'Full digital identity suite for companies, agencies and leaders.',
      features: ['Unlimited Profiles', '5 Linked Businesses', 'All 6 Luxury Themes', 'Priority Support', 'Full Analytics'],
    },
  ];

  const faqs = [
    {
      q: 'Does the recipient need an app to receive my contact details?',
      a: 'No. When someone taps your NFC card or scans your QR code, your digital profile opens instantly in their native mobile browser. They can save your contact (vCard) with one tap.',
    },
    {
      q: 'Can I change my profile information after printing a card?',
      a: 'Yes. Taptch uses dynamic redirection. You can update your phone, email, business bio, UPI QR code, and portfolio anytime from your dashboard without reprinting your card.',
    },
    {
      q: 'Which phones are compatible with Taptch NFC cards?',
      a: 'Virtually all modern smartphones (iPhone XS and newer, plus 95%+ of modern Android devices) support background NFC reading without requiring an app.',
    },
  ];

  return (
    <div className="relative overflow-hidden bg-[#0A0A0C]">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Your Digital Identity.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37]">
            One Contactless Tap.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {brandConfig.tagline} Elevate your networking with bespoke NFC business cards, dynamic QR engines, and luxury digital profile templates.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto bg-primary text-black hover:bg-primary-hover font-semibold px-8 py-6 text-base rounded-xl shadow-lg shadow-primary/20">
              Create Your Digital Card
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/templates">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-border/80 hover:bg-white/5 px-8 py-6 text-base rounded-xl">
              Explore Luxury Themes
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Pillar Grid */}
      <section className="py-24 border-t border-border/40 bg-[#0C0C0F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Engineered for Executives, Founders & Creators
            </h2>
            <p className="mt-4 text-muted-foreground text-base">
              A complete identity system replacing paper cards forever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-[#121216] border border-border/60 hover:border-primary/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Instant NFC Tap</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Seamless contactless exchange. No mobile apps required for the receiver. Works natively on iPhone & Android.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#121216] border border-border/60 hover:border-primary/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Dynamic Unguessable QR</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Update your card destination in real-time. Change links, catalogue PDFs, and contact details without reprinting.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#121216] border border-border/60 hover:border-primary/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">6 Bespoke Luxury Themes</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                From Obsidian Luxury and Onyx Minimal to Apex Capital. Dual-device live preview studio for unmatched elegance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 border-t border-border/40 bg-[#0A0A0C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Transparent Plans for Every Ambition</h2>
            <p className="mt-4 text-muted-foreground">Get started for free or unlock luxury themes and business tools.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`rounded-2xl p-6 flex flex-col justify-between ${p.highlighted
                    ? 'bg-[#18181F] border-2 border-primary shadow-xl shadow-primary/10'
                    : 'bg-[#121216] border border-border/60'
                  }`}
              >
                <div>
                  <span className="text-[11px] font-mono text-primary uppercase tracking-wider font-semibold">
                    {p.badge}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">{p.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-extrabold text-white">{p.price}</span>
                    <span className="text-xs text-muted-foreground ml-1">{p.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">{p.desc}</p>
                  <ul className="mt-6 space-y-2.5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-center text-xs text-neutral-300">
                        <Check className="w-3.5 h-3.5 text-primary mr-2 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link to="/register" className="mt-8">
                  <Button
                    variant={p.highlighted ? 'gold' : 'outline'}
                    className="w-full text-xs font-semibold py-2.5"
                  >
                    Select {p.name}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 border-t border-border/40 bg-[#0C0C0F]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="p-6 rounded-xl bg-[#121216] border border-border/60">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                  {faq.q}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
