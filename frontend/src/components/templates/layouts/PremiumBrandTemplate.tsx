'use client';

import * as React from 'react';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Share2,
  Building,
  QrCode,
  ShieldCheck,
  Send,
  ExternalLink,
  Crown,
  Sparkles,
  Lock,
} from 'lucide-react';
import type { TemplateLayoutProps } from './types';
import { UpiPaymentCard } from '@/components/profile/UpiPaymentCard';
import type { UpiPaymentConfig } from '@/lib/upi';

export function PremiumBrandTemplate({
  profile,
  onDownloadVCard,
  onOpenExchange,
  onOpenQr,
  onCopyLink,
  previewPlanId,
}: TemplateLayoutProps) {
  const businesses = profile.businesses || [];
  const catalogue = profile.catalogue || [];
  const primaryBusiness = businesses[0];
  const isNano = previewPlanId === 'nano';

  const rawUpi = (profile as unknown as { customFields?: { upiConfig?: UpiPaymentConfig } }).customFields?.upiConfig;
  const upiConfig: UpiPaymentConfig | null = rawUpi?.isEnabled && rawUpi.upiId ? rawUpi : null;

  return (
    <div className="w-full min-h-screen bg-[#0A0A0C] text-[#EDEDED] flex flex-col items-center">
      {/* Demo Notice */}
      {profile.isDemo && (
        <div className="w-full bg-[#D4AF37]/15 border-b border-[#D4AF37]/30 px-4 py-2 text-center text-xs text-[#D4AF37] font-medium">
          [DEMO PROFILE] Meridian Luxury Estates &mdash; Realistic prestige brand &amp; private wealth sample
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-3xl px-4 sm:px-6 py-8 space-y-8">
        {/* Obsidian Hero Card */}
        <div className="rounded-3xl border border-[#D4AF37]/30 bg-[#121216] shadow-2xl overflow-hidden relative">
          <div className="h-44 sm:h-56 w-full relative bg-neutral-900">
            {profile.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.coverUrl}
                alt="Luxury Background"
                className="w-full h-full object-cover brightness-75"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-amber-950/40 via-neutral-900 to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-transparent to-black/40" />

            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={onOpenQr}
                className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-white hover:bg-black/80 transition-colors shadow-lg backdrop-blur-md"
                title="View VIP QR"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onCopyLink}
                className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-white hover:bg-black/80 transition-colors shadow-lg backdrop-blur-md"
                title="Share Card"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            <div className="absolute top-4 left-4">
              <Badge className="bg-[#D4AF37] text-neutral-950 font-bold tracking-wide uppercase text-[10px] px-3 py-1 shadow-md">
                <Crown className="w-3 h-3 mr-1.5 inline" />
                Obsidian Luxury &amp; Private Reserve
              </Badge>
            </div>
          </div>

          <div className="px-6 pb-6 pt-0 relative flex flex-col items-center text-center -mt-16 sm:-mt-20">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl border-4 border-[#121216] overflow-hidden bg-[#18181D] flex items-center justify-center font-bold text-3xl shadow-2xl text-[#D4AF37]">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profile.displayName.charAt(0)}</span>
              )}
            </div>

            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  {profile.displayName}
                </h1>
                <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
              </div>
              {profile.headline && (
                <p className="text-sm font-medium text-neutral-300 max-w-lg">
                  {profile.headline}
                </p>
              )}
              {primaryBusiness?.companyName && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 pt-1">
                  <Building className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span>{primaryBusiness.companyName}</span>
                  {primaryBusiness.roleTitle && <span>&bull; {primaryBusiness.roleTitle}</span>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-6">
              <Button
                variant="gold"
                onClick={onDownloadVCard}
                className="gap-2 shadow-lg font-semibold text-xs h-10"
              >
                <Download className="h-4 w-4" />
                <span>Save this profile</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenExchange('Private Concierge & Portfolio Inquiry')}
                className="gap-2 font-semibold text-xs h-10 border-white/20 bg-white/5 hover:bg-white/10"
              >
                <Send className="h-4 w-4 text-[#D4AF37]" />
                <span>Exchange Card</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Direct UPI Payment Section */}
        {upiConfig && (
          <UpiPaymentCard
            config={upiConfig}
            className="bg-[#121216] border-[#D4AF37]/30 text-white"
          />
        )}

        {/* Private Bio / Brand Philosophy */}
        {profile.bio && (
          <div className="p-6 rounded-2xl border border-white/10 bg-[#121216] space-y-2">
            <h3 className="text-xs uppercase tracking-wider font-bold text-[#D4AF37]">
              Brand Philosophy &amp; Private Portfolio
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Plan Lock Banner */}
        {isNano && (
          <div className="p-4 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <div>
                <span className="font-bold">Max Plan Exclusive:</span> High-resolution private asset portfolio and concierge lead exchange are unlocked on Max.
              </div>
            </div>
            <Badge variant="outline" className="border-[#D4AF37]/50 text-[#D4AF37] shrink-0 text-[10px]">
              Available in Max Tier
            </Badge>
          </div>
        )}

        {/* Exclusive Showcase */}
        {catalogue.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  Curated Private Assets &amp; Services
                </h2>
                <p className="text-xs text-neutral-400">Exclusive acquisitions &amp; bespoke mandates</p>
              </div>
              <Badge variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37] text-xs">
                {catalogue.length} Private Listings
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {catalogue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-[#121216] p-5 flex flex-col justify-between space-y-4 hover:border-[#D4AF37]/40 transition-colors shadow-lg"
                >
                  <div className="space-y-3">
                    {item.imageUrl && (
                      <div className="h-48 w-full rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between text-[11px] uppercase font-bold text-[#D4AF37]">
                        <span>{item.itemType}</span>
                        {item.price && (
                          <span className="font-mono text-sm text-white font-bold">
                            {item.currency || '₹'} {item.price}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white mt-1 leading-snug">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-neutral-400 mt-2 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={() => onOpenExchange(`Private enquiry for: ${item.title}`)}
                      className="w-full text-xs h-9 gap-1.5 font-bold"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Request Mandate</span>
                    </Button>
                    {item.actionUrl && (
                      <a href={item.actionUrl} target="_blank" rel="noopener noreferrer">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 bg-white/5 hover:bg-white/10 text-xs h-9 px-3"
                          title="View Details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="w-full py-8 text-center border-t border-white/10 text-xs text-neutral-500">
          <div className="flex items-center justify-center gap-2">
            <span>Powered by</span>
            <span className="font-bold text-[#D4AF37]">{brandConfig.name}</span>
            <span>&mdash; Obsidian Luxury Edition</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

