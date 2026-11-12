import React from 'react';
import { Link } from 'react-router-dom';
import { brandConfig } from '@taptch/shared';
import { Button } from '../components/ui/button';
import { ArrowRight, Sparkles, Shield, Zap, Layers, Smartphone } from 'lucide-react';

export function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Next Generation of Professional Identity</span>
        </div>

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
    </div>
  );
}
