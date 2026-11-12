import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Check, Sparkles } from 'lucide-react';

export function PricingPage() {
  const plans = [
    {
      name: 'Nano',
      price: '₹0',
      period: 'forever',
      description: 'Essential digital identity for individual professionals.',
      features: ['1 Digital Profile', '1 NFC Physical Card Link', 'Essential Analytics (7 days)', 'Executive & Onyx Themes'],
      cta: 'Start Free',
      popular: false,
    },
    {
      name: 'Micro',
      price: '₹999',
      period: 'per year',
      description: 'Ideal for consultants, solo practitioners, and founders.',
      features: ['3 Digital Profiles', '3 NFC Card Links', '30-Day Scan Retention', 'Aurora Creator Theme', 'Lead Export (CSV)'],
      cta: 'Get Micro',
      popular: true,
    },
    {
      name: 'Mini',
      price: '₹2,499',
      period: 'per year',
      description: 'Engineered for growing teams and boutique agencies.',
      features: ['10 Digital Profiles', '10 NFC Card Links', '90-Day Analytics', 'Custom CSS & Brand Overrides', 'Ivory Minimalist & Zenith Themes'],
      cta: 'Get Mini',
      popular: false,
    },
    {
      name: 'Max',
      price: '₹5,999',
      period: 'per year',
      description: 'Enterprise prestige and multi-business identity.',
      features: ['100 Digital Profiles', '100 Card Links', 'Apex Capital Theme', 'Custom Domains', 'Dedicated Support'],
      cta: 'Get Max',
      popular: false,
    },
  ];

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simple, Transparent Plans</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
          Designed for Individuals and Teams
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Zero hidden fees. Unlimited taps and profile scans on all tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`p-6 rounded-2xl bg-[#121216] border flex flex-col justify-between ${
              p.popular ? 'border-primary shadow-xl shadow-primary/10' : 'border-border/60'
            }`}
          >
            <div>
              {p.popular && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary text-black mb-3">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-white">{p.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">{p.description}</p>
              <div className="flex items-baseline mb-6">
                <span className="text-3xl font-extrabold text-white">{p.price}</span>
                <span className="text-xs text-muted-foreground ml-1.5">/{p.period}</span>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground border-t border-border/40 pt-4">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <Link to="/register">
                <Button
                  className={`w-full font-semibold rounded-xl text-xs ${
                    p.popular
                      ? 'bg-primary text-black hover:bg-primary-hover'
                      : 'bg-white/5 hover:bg-white/10 text-white'
                  }`}
                >
                  {p.cta}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

