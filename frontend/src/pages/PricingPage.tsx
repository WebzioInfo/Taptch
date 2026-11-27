import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Check } from 'lucide-react';

export function PricingPage() {
  const plans = [
    {
      id: 'nano',
      name: 'Nano',
      tag: 'FREE FOREVER',
      price: '₹0',
      period: 'forever',
      desc: 'Essential digital identity for individual professionals and graduates.',
      features: [
        '1 Digital Profile',
        'Standard Minimal Theme',
        'Instant vCard Download',
        'Dynamic Profile QR Code',
        '7-Day Analytics Retention',
      ],
      cta: 'Start Free',
      popular: false,
    },
    {
      id: 'micro',
      name: 'Micro',
      tag: 'SOLO PROFESSIONAL',
      price: '₹499',
      period: '/year',
      desc: 'Ideal for consultants, solo practitioners, and independent advisors.',
      features: [
        '2 Digital Profiles',
        '1 Linked Business Profile',
        '3 Luxury Themes',
        'Contact Exchange Lead Form',
        'Photo Gallery (5 items)',
        '30-Day Analytics',
      ],
      cta: 'Get Micro',
      popular: false,
    },
    {
      id: 'mini',
      name: 'Mini',
      tag: 'MOST POPULAR',
      price: '₹1,499',
      period: '/year',
      desc: 'Engineered for growing small businesses, boutique studios, and practices.',
      features: [
        '5 Digital Profiles',
        '2 Linked Businesses',
        'All 6 Luxury Themes',
        'Products & Menu Catalogue',
        'Direct WhatsApp & UPI Pay',
        'PDF Brochure Attachments',
        'Custom QR Styling & Logo',
        '90-Day Analytics & CSV Export',
      ],
      cta: 'Get Mini',
      popular: true,
    },
    {
      id: 'max',
      name: 'Max',
      tag: 'ENTERPRISE SUITE',
      price: '₹2,999',
      period: '/year',
      desc: 'Enterprise prestige and multi-business digital identity suite.',
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
      cta: 'Get Max',
      popular: false,
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

  return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-[var(--bg-page)] text-[var(--ink)]">
        <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--accent-text)]">
              TRANSPARENT VALUE
            </span>
            <h1 className="font-head text-4xl font-medium tracking-tight text-[var(--ink)] sm:text-5xl mt-2">
              Designed for Individuals and Teams
            </h1>
              <p className="mt-3 text-base font-body text-[var(--ink-muted)]">
                Zero hidden fees. Unlimited taps and profile scans on all tiers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((p) => (
                <div
                  key={p.name}
            className={`p-6 rounded-[var(--radius-md)] bg-[var(--bg-surface)] flex flex-col justify-between ${p.popular
                      ? 'border-2 border-[var(--accent)] shadow-none'
                      : 'border border-[var(--border)]'
                    }`}
                >
                  <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--accent-text)]">
                            {p.tag}
                          </span>
                          {p.popular && (
                            <span className="font-mono text-[10px] bg-[var(--accent)] text-[var(--accent-ink)] px-2 py-0.5 rounded-[var(--radius-sm)] font-medium uppercase">
                              POPULAR
                            </span>
                          )}
                        </div>
                        <h3 className="font-head text-xl font-medium text-[var(--ink)]">{p.name}</h3>
                        <p className="font-body text-xs text-[var(--ink-muted)] mt-1 mb-4 leading-relaxed">{p.desc}</p>
                        <div className="flex items-baseline mb-6">
                          <span className="font-head text-3xl font-medium text-[var(--ink)]">{p.price}</span>
                          <span className="font-body text-xs text-[var(--ink-muted)] ml-1">{p.period}</span>
                        </div>

                          <ul className="space-y-2.5 font-body text-xs text-[var(--ink)] border-t border-[var(--border)] pt-4">
                            {p.features.map((f) => (
                                <li key={f} className="flex items-start gap-2">
                                  <Check className="w-3.5 h-3.5 text-[var(--accent-text)] flex-shrink-0 mt-0.5" />
                                  <span>{f}</span>
                                </li>
                ))}
                              </ul>
            </div>

                          <div className="mt-8">
                            <Link to="/register">
                              <Button
                                variant={p.popular ? 'accent' : 'outline'}
                                className="w-full font-medium rounded-[var(--radius-sm)] text-xs py-2"
                              >
                                {p.cta}
                              </Button>
                            </Link>
                          </div>
                        </div>
        ))}
                      </div>

      {/* Comparison Table */}
                    <div className="mt-16 border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden bg-[var(--bg-surface)]">
                      <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-raised)]">
                        <h2 className="font-head text-lg font-medium text-[var(--ink)]">Plan Feature Comparison</h2>
                        <p className="font-body text-xs text-[var(--ink-muted)] mt-1">Full breakdown of entitlements across tiers.</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-body text-xs">
                          <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)] font-mono text-[11px] text-[var(--ink-muted)]">
                              <th className="py-3 px-4 font-medium">Feature</th>
                              <th className="py-3 px-4 font-medium">Nano</th>
                              <th className="py-3 px-4 font-medium">Micro</th>
                              <th className="py-3 px-4 font-medium text-[var(--accent-text)]">Mini</th>
                              <th className="py-3 px-4 font-medium">Max</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {comparisonFeatures.map((row, idx) => (
                              <tr key={idx} className="hover:bg-[var(--bg-page)] transition-colors">
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
                  );
}
