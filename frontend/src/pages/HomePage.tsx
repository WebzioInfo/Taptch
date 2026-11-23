import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { brandConfig } from '../config/brand';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { HeroCardVisual } from '../components/marketing/HeroCardVisual';
import {
  ArrowRight,
  Zap,
  Smartphone,
  Check,
  ChevronDown,
  Layers,
  Share2,
  ShieldCheck,
  BarChart3,
  CreditCard,
  Briefcase,
} from 'lucide-react';

export function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const plans = [
    {
      id: 'nano',
      name: 'Nano',
      tag: 'FREE FOREVER',
      price: '₹0',
      period: 'forever',
      desc: 'Create your digital profile and start sharing contact details with a simple tap.',
      features: [
        '1 Digital Profile',
        'Standard Minimal Theme',
        'Instant vCard Phonebook Sync',
        'Dynamic QR Code',
        'Basic Visit Analytics',
      ],
      cta: 'Start Free',
      highlighted: false,
    },
    {
      id: 'micro',
      name: 'Micro',
      tag: 'SOLO PROFESSIONAL',
      price: '₹499',
      period: '/year',
      desc: 'Ideal for independent consultants, freelancers, and solo practitioners.',
      features: [
        '2 Digital Profiles',
        '1 Linked Business Profile',
        '3 Luxury Themes',
        'Contact Exchange Lead Form',
        'Photo Gallery (5 items)',
        '30-Day Analytics',
      ],
      cta: 'Select Micro',
      highlighted: false,
    },
    {
      id: 'mini',
      name: 'Mini',
      tag: 'MOST POPULAR',
      price: '₹1,499',
      period: '/year',
      desc: 'Designed for small business owners, boutique studios, and growing practices.',
      features: [
        '5 Digital Profiles',
        '2 Linked Businesses',
        'All 6 Luxury Themes',
        'Products & Menu Catalogue',
        'Direct WhatsApp & UPI Pay',
        'PDF Brochure Attachments',
        'Custom QR Logo & Colors',
        '90-Day Analytics & CSV Export',
      ],
      cta: 'Get Mini',
      highlighted: true,
    },
    {
      id: 'max',
      name: 'Max',
      tag: 'ENTERPRISE SUITE',
      price: '₹2,999',
      period: '/year',
      desc: 'Full digital identity suite for corporate teams, agencies, and brand leaders.',
      features: [
        'Unlimited Digital Profiles',
        '5 Linked Businesses',
        'All 6 Luxury Themes',
        'Full Product & Service Matrix',
        'Custom Domain Support',
        'Team Member Delegation',
        '365-Day Advanced Analytics',
        'Priority Phone & WhatsApp Support',
      ],
      cta: 'Select Max',
      highlighted: false,
    },
  ];

  const comparisonFeatures = [
    { name: 'Digital Profiles', nano: '1', micro: '2', mini: '5', max: 'Unlimited' },
    { name: 'Linked Businesses', nano: 'None', micro: '1', mini: '2', max: '5' },
    { name: 'Themes Access', nano: 'Standard', micro: '3 Themes', mini: 'All 6 Luxury', max: 'All 6 Luxury' },
    { name: 'Instant vCard Download', nano: true, micro: true, mini: true, max: true },
    { name: 'Products & Catalogue', nano: false, micro: false, mini: true, max: true },
    { name: 'WhatsApp Direct Chat', nano: true, micro: true, mini: true, max: true },
    { name: 'UPI Payment Link', nano: false, micro: false, mini: true, max: true },
    { name: 'PDF Brochures', nano: false, micro: false, mini: true, max: true },
    { name: 'Analytics History', nano: '7 Days', micro: '30 Days', mini: '90 Days', max: '365 Days' },
    { name: 'Custom Domain Support', nano: false, micro: false, mini: false, max: true },
  ];

  const templates = [
    {
      id: 'obsidian',
      name: 'Obsidian Luxury',
      category: 'Flagship Dark',
      desc: 'Deep black matte surface with metallic gold accents. Engineered for executive poise.',
      themeClass: 'bg-[#121216] border-[#2E2E2C] text-[#E9E9E6]',
      accentColor: '#D4AF37',
    },
    {
      id: 'ivory',
      name: 'Ivory Minimalist',
      category: 'Editorial Light',
      desc: 'Warm paper texture with crisp editorial serif typography and terracotta lines.',
      themeClass: 'bg-[#F9F8F6] border-[#E2DFD8] text-[#161616]',
      accentColor: '#B84800',
    },
    {
      id: 'aurora',
      name: 'Aurora Creator',
      category: 'Glassmorphism',
      desc: 'Deep cosmic backdrop with neon cyan and violet glass accents for creators.',
      themeClass: 'bg-[#0F172A] border-[#1E293B] text-[#F8FAFC]',
      accentColor: '#38BDF8',
    },
    {
      id: 'onyx',
      name: 'Onyx Minimal',
      category: 'Monochrome',
      desc: 'Pure high-contrast black and white Swiss typography. Raw, direct, uncompromising.',
      themeClass: 'bg-[#000000] border-[#333333] text-[#FFFFFF]',
      accentColor: '#E9E9E6',
    },
  ];

  const faqs = [
    {
      q: 'Does the recipient need any app to receive my contact details?',
      a: 'No app is needed. When someone taps your NFC card or scans your QR code, your digital profile opens instantly in their default mobile browser (Safari, Chrome). They can save your full contact card to their phonebook with a single tap.',
    },
    {
      q: 'Can I change my profile information after printing a card?',
      a: 'Yes, completely. Taptch uses dynamic unguessable redirection. You can update your phone number, email, company bio, social links, catalogue products, and UPI QR code anytime from your dashboard without ever reprinting your card.',
    },
    {
      q: 'Which smartphones are compatible with Taptch NFC cards?',
      a: 'Nearly 100% of modern smartphones support native background NFC reading without third-party software. This includes iPhone XS and newer (iOS 13+), and over 95% of modern Android devices with NFC enabled.',
    },
    {
      q: 'How does the phonebook vCard sync work?',
      a: 'Your profile includes a prominent "Save Contact" action that downloads an industry-standard .vcf contact file containing your full name, mobile number, WhatsApp link, email, company, job title, and profile URL directly into the user\'s Contacts app.',
    },
    {
      q: 'Can I use Taptch strictly as a digital link without buying a physical card?',
      a: 'Yes! Every Taptch account comes with a unique public URL (e.g. taptch.com/p/yourname) and a high-resolution QR code you can embed in email signatures, LinkedIn bios, zoom backgrounds, or presentations.',
    },
  ];

  return (
    <div className="relative overflow-hidden bg-[var(--bg-page)] text-[var(--ink)]">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline and CTAs */}
          <div className="lg:col-span-7 space-y-6">
            {/* <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--ink-muted)]"> */}
            {/* <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                  <span className="font-mono text-[11px] font-medium tracking-[0.04em] uppercase text-[var(--ink)]">
                    Next-Gen Contactless Identity
                  </span> */}
            {/* </div> */}

            <h1 className="font-head text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[var(--ink)] leading-[1.08]">
              Your digital identity.<br />
              <span className="text-[var(--accent)]">Built to be tapped.</span>
            </h1>

            <p className="text-base sm:text-lg font-body text-[var(--ink-muted)] leading-relaxed max-w-xl">
              Elevate how you exchange credentials. Bespoke contactless NFC cards, dynamic instant-routing QR codes, and luxury digital profiles that sync directly to phonebooks in one second.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link to="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[var(--ink)] text-[var(--bg-page)] hover:opacity-90 font-medium px-6 py-3 text-sm rounded-[var(--radius-sm)] shadow-none flex items-center justify-center gap-2"
                >
                  <span>Create Your Digital Card</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/templates">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-[var(--border)] text-[var(--ink)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)] px-6 py-3 text-sm rounded-[var(--radius-sm)] font-medium"
                >
                  Explore Luxury Themes
                </Button>
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-6 font-mono text-[11px] text-[var(--ink-muted)]">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                <span>Zero app required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                <span>iOS & Android native</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                <span>One-tap vCard phonebook sync</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Matte Black Taptch NFC Card Stack */}
          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
            <HeroCardVisual />
          </div>
        </div>
      </section >

      {/* Bento Grid Features */}
      < section className="py-20 border-t border-[var(--border)] bg-[var(--bg-surface)]" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--accent-text)]">
              ARCHITECTURAL FOUNDATION
            </span>
            <h2 className="font-head text-3xl sm:text-4xl font-medium tracking-tight text-[var(--ink)] mt-2">
              Engineered for Modern Networking
            </h2>
            <p className="font-body text-sm sm:text-base text-[var(--ink-muted)] mt-2">
              Every detail built with purpose: sub-50ms redirection, crisp luxury layouts, and zero client dependencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Bento Card 1: NFC Contactless */}
            <div className="md:col-span-2 p-7 rounded-[var(--radius-md)] bg-[var(--bg-page)] border border-[var(--border)] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--ink)] mb-5">
                  <Smartphone className="w-5 h-5 text-[var(--accent-text)]" />
                </div>
                <h3 className="font-head text-xl font-medium tracking-tight text-[var(--ink)]">
                  Contactless NFC Hardware
                </h3>
                <p className="font-body text-sm text-[var(--ink-muted)] mt-2 leading-relaxed max-w-xl">
                  Embedded with high-frequency NXP NTAG213 chips. Simply tap against any modern smartphone to transmit your complete identity card in milliseconds. No batteries, no pairing, no app.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center gap-4 font-mono text-[11px] text-[var(--ink-muted)]">
                <span>PVC &bull; MATTE METAL &bull; BAMBOO WOOD</span>
              </div>
            </div>

            {/* Bento Card 2: vCard Phonebook Sync */}
            <div className="p-7 rounded-[var(--radius-md)] bg-[var(--bg-page)] border border-[var(--border)] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--ink)] mb-5">
                  <Share2 className="w-5 h-5 text-[var(--accent-text)]" />
                </div>
                <h3 className="font-head text-xl font-medium tracking-tight text-[var(--ink)]">
                  Instant vCard Sync
                </h3>
                <p className="font-body text-sm text-[var(--ink-muted)] mt-2 leading-relaxed">
                  Single-tap contact addition. Syncs your full name, photo, direct phone numbers, WhatsApp, and social handles straight into the receiver's phonebook.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--border)] font-mono text-[11px] text-[var(--ink-muted)]">
                STANDARD .VCF 3.0 / 4.0
              </div>
            </div>

            {/* Bento Card 3: Dynamic Redirection */}
            <div className="p-7 rounded-[var(--radius-md)] bg-[var(--bg-page)] border border-[var(--border)] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--ink)] mb-5">
                  <Zap className="w-5 h-5 text-[var(--accent-text)]" />
                </div>
                <h3 className="font-head text-xl font-medium tracking-tight text-[var(--ink)]">
                  Dynamic Unguessable QR
                </h3>
                <p className="font-body text-sm text-[var(--ink-muted)] mt-2 leading-relaxed">
                  Never reprint a card again. Update your company, phone, portfolio decks, or UPI QR code in real-time from your studio.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--border)] font-mono text-[11px] text-[var(--ink-muted)]">
                SUB-50MS EDGE REDIRECTION
              </div>
            </div>

            {/* Bento Card 4: Dual Personal & Business Profiles */}
            <div className="md:col-span-2 p-7 rounded-[var(--radius-md)] bg-[var(--bg-page)] border border-[var(--border)] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--ink)] mb-5">
                  <Briefcase className="w-5 h-5 text-[var(--accent-text)]" />
                </div>
                <h3 className="font-head text-xl font-medium tracking-tight text-[var(--ink)]">
                  Personal & Business Architecture
                </h3>
                <p className="font-body text-sm text-[var(--ink-muted)] mt-2 leading-relaxed max-w-xl">
                  Seamlessly associate multiple ventures under one executive identity. Showcase product catalogues, service menus, team coordinates, and physical branch locations with dedicated contact buttons.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center gap-4 font-mono text-[11px] text-[var(--ink-muted)]">
                <span>MULTI-VENTURE &bull; CATALOGUE &bull; BRANCHES</span>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Template Gallery */}
      < section className="py-20 border-t border-[var(--border)] bg-[var(--bg-page)]" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--accent-text)]">
                CURATED AESTHETICS
              </span>
              <h2 className="font-head text-3xl sm:text-4xl font-medium tracking-tight text-[var(--ink)] mt-2">
                Luxury Digital Profile Themes
              </h2>
              <p className="font-body text-sm sm:text-base text-[var(--ink-muted)] mt-2">
                Designed to project authority, craft, and distinct personality.
              </p>
            </div>
            <Link to="/templates">
              <Button variant="outline" size="sm" className="font-medium gap-1 text-xs">
                <span>View All Themes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] flex flex-col justify-between"
              >
                <div>
                  <div className={`aspect-[9/12] w-full rounded-[var(--radius-sm)] border p-4 mb-4 flex flex-col justify-between ${tpl.themeClass}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[9px] uppercase tracking-wider opacity-70">
                        {tpl.category}
                      </span>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tpl.accentColor }} />
                    </div>
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-full border border-current/20 flex items-center justify-center font-head text-[10px] font-medium">
                        TC
                      </div>
                      <div className="font-head text-xs font-medium">{tpl.name}</div>
                      <div className="font-mono text-[9px] opacity-60">taptch.com/p/demo</div>
                    </div>
                  </div>
                  <h3 className="font-head text-base font-medium text-[var(--ink)]">{tpl.name}</h3>
                  <p className="font-body text-xs text-[var(--ink-muted)] mt-1 leading-relaxed">
                    {tpl.desc}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[var(--border)]">
                  <Link to="/builder/new">
                    <Button variant="ghost" size="sm" className="w-full text-xs font-medium justify-between px-2">
                      <span>Use this theme</span>
                      <ArrowRight className="w-3 h-3 text-[var(--accent-text)]" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* Pricing Section & Comparison */}
      < section className="py-20 border-t border-[var(--border)] bg-[var(--bg-surface)]" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--accent-text)]">
              CLEAR &amp; TRANSPARENT TIERS
            </span>
            <h2 className="font-head text-3xl sm:text-4xl font-medium tracking-tight text-[var(--ink)] mt-2">
              Plans Built for Every Stage
            </h2>
            <p className="font-body text-sm sm:text-base text-[var(--ink-muted)] mt-2">
              Start free with Nano or scale your professional presence with our advanced tiers.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`rounded-[var(--radius-md)] p-6 bg-[var(--bg-page)] flex flex-col justify-between ${p.highlighted
                  ? 'border-2 border-[var(--accent)] shadow-none'
                  : 'border border-[var(--border)]'
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--accent-text)]">
                      {p.tag}
                    </span>
                    {p.highlighted && (
                      <span className="font-mono text-[10px] bg-[var(--accent)] text-[var(--accent-ink)] px-2 py-0.5 rounded-[var(--radius-sm)] font-medium uppercase">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <h3 className="font-head text-xl font-medium text-[var(--ink)] mt-2">{p.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="font-head text-3xl font-medium text-[var(--ink)]">{p.price}</span>
                    <span className="font-body text-xs text-[var(--ink-muted)] ml-1">{p.period}</span>
                  </div>
                  <p className="font-body text-xs text-[var(--ink-muted)] mt-3 leading-relaxed">{p.desc}</p>

                  <ul className="mt-6 space-y-2.5 pt-4 border-t border-[var(--border)] font-body text-xs text-[var(--ink)]">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link to="/register">
                    <Button
                      variant={p.highlighted ? 'accent' : 'outline'}
                      className="w-full text-xs font-medium py-2 rounded-[var(--radius-sm)]"
                    >
                      {p.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          < div className="mt-16 border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden bg-[var(--bg-page)]" >
            <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-surface)]">
              <h3 className="font-head text-lg font-medium text-[var(--ink)]">Plan Feature Comparison</h3>
              <p className="font-body text-xs text-[var(--ink-muted)] mt-1">Detailed breakdown of platform capabilities across tiers.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)]/50 font-mono text-[11px] text-[var(--ink-muted)]">
                    <th className="py-3 px-4 font-medium">Capability</th>
                    <th className="py-3 px-4 font-medium">Nano</th>
                    <th className="py-3 px-4 font-medium">Micro</th>
                    <th className="py-3 px-4 font-medium text-[var(--accent-text)]">Mini</th>
                    <th className="py-3 px-4 font-medium">Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {comparisonFeatures.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-surface)]/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-[var(--ink)]">{row.name}</td>
                      <td className="py-3 px-4 text-[var(--ink-muted)]">
                        {typeof row.nano === 'boolean' ? (
                          row.nano ? <Check className="w-4 h-4 text-[var(--accent-text)]" /> : <span className="text-[var(--border-strong)]">&mdash;</span>
                        ) : (
                          row.nano
                        )}
                      </td>
                      <td className="py-3 px-4 text-[var(--ink-muted)]">
                        {typeof row.micro === 'boolean' ? (
                          row.micro ? <Check className="w-4 h-4 text-[var(--accent-text)]" /> : <span className="text-[var(--border-strong)]">&mdash;</span>
                        ) : (
                          row.micro
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-[var(--ink)] bg-[var(--accent)]/5">
                        {typeof row.mini === 'boolean' ? (
                          row.mini ? <Check className="w-4 h-4 text-[var(--accent-text)]" /> : <span className="text-[var(--border-strong)]">&mdash;</span>
                        ) : (
                          row.mini
                        )}
                      </td>
                      <td className="py-3 px-4 text-[var(--ink-muted)]">
                        {typeof row.max === 'boolean' ? (
                          row.max ? <Check className="w-4 h-4 text-[var(--accent-text)]" /> : <span className="text-[var(--border-strong)]">&mdash;</span>
                        ) : (
                          row.max
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section >

      {/* Accordion FAQ Section */}
      < section className="py-20 border-t border-[var(--border)] bg-[var(--bg-page)]" >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--accent-text)]">
              FREQUENTLY ASKED
            </span>
            <h2 className="font-head text-3xl font-medium tracking-tight text-[var(--ink)] mt-2">
              Common Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    aria-expanded={isOpen}
                  >
                    <span className="font-head text-sm sm:text-base font-medium text-[var(--ink)]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[var(--ink-muted)] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--accent-text)]' : ''
                        }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 font-body text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed border-t border-[var(--border)]/60 mt-1 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section >
    </div >
  );
}
