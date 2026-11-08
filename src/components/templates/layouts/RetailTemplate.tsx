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
  MessageCircle,
  MapPin,
  Clock,
  ShoppingBag,
  Sparkles,
  Lock,
} from 'lucide-react';
import type { TemplateLayoutProps } from './types';

export function RetailTemplate({
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

  const phoneClean = (profile.whatsapp || profile.phone || '').replace(/[^0-9]/g, '');
  const waOrderUrl = (itemTitle: string) =>
    phoneClean
      ? `https://wa.me/${phoneClean}?text=Hello,%20I%20am%20interested%20in%20ordering:%20${encodeURIComponent(itemTitle)}`
      : null;

  return (
    <div className="w-full min-h-screen bg-[#0F172A] text-slate-100 flex flex-col items-center">
      {/* Demo Notice */}
      {profile.isDemo && (
        <div className="w-full bg-rose-500/15 border-b border-rose-500/30 px-4 py-2 text-center text-xs text-rose-300 font-medium">
          [DEMO PROFILE] Malabar Silk & Crafts &mdash; Realistic retail & commercial store sample
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-4xl px-4 sm:px-6 py-8 space-y-8">
        {/* Storefront Hero Card */}
        <div className="rounded-3xl border border-rose-500/20 bg-[#1E293B] shadow-2xl overflow-hidden relative">
          {/* Storefront Visual Banner */}
          <div className="h-44 sm:h-56 w-full relative bg-slate-800">
            {profile.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.coverUrl}
                alt="Storefront"
                className="w-full h-full object-cover brightness-90"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-rose-900/40 via-purple-900/30 to-slate-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] via-transparent to-black/30" />

            {/* Quick Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={onOpenQr}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white hover:bg-slate-800 transition-colors shadow-lg"
                title="View Store QR"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onCopyLink}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white hover:bg-slate-800 transition-colors shadow-lg"
                title="Share Store Link"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {/* Retail Category Ribbon */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-rose-600 text-white font-bold tracking-wide uppercase text-[10px] px-3 py-1 shadow-md">
                <ShoppingBag className="w-3 h-3 mr-1.5 inline" />
                Retail & Handcrafted Showcase
              </Badge>
            </div>
          </div>

          {/* Store Details Header */}
          <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left -mt-14 sm:-mt-16">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border-4 border-[#1E293B] overflow-hidden bg-slate-800 flex items-center justify-center font-bold text-3xl shadow-2xl shrink-0">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-rose-400">{profile.displayName.charAt(0)}</span>
              )}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  {profile.displayName}
                </h1>
                <ShieldCheck className="h-5 w-5 text-rose-400 shrink-0" />
              </div>
              {profile.headline && (
                <p className="text-sm font-medium text-slate-300 leading-snug">
                  {profile.headline}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-400 pt-1">
                {profile.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-400" />
                    {profile.location}
                  </span>
                )}
                {profile.workingHours && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-rose-400" />
                    {profile.workingHours}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0 mt-4 md:mt-0">
              {phoneClean && (
                <a
                  href={`https://wa.me/${phoneClean}?text=Hello%20${encodeURIComponent(profile.displayName)},%20I%20saw%20your%20collection%20on%20${brandConfig.name}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none"
                >
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 text-xs h-10 px-5 shadow-lg shadow-emerald-600/20">
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp Store</span>
                  </Button>
                </a>
              )}
              <Button
                variant="outline"
                onClick={onDownloadVCard}
                className="flex-1 md:flex-none border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs h-10 px-5 gap-2"
              >
                <Download className="h-4 w-4 text-rose-400" />
                <span>Save this profile</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Store Highlights / Badges */}
        {profile.highlights && profile.highlights.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {profile.highlights.map((h, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-center flex flex-col items-center justify-center space-y-1"
              >
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-semibold text-slate-200">{h}</span>
              </div>
            ))}
          </div>
        )}

        {/* Plan Lock Banner */}
        {isNano && (
          <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold">Micro / Mini Feature:</span> Product collections with direct WhatsApp ordering are unlocked on Micro & Mini plans.
              </div>
            </div>
            <Badge variant="outline" className="border-rose-400/50 text-rose-300 shrink-0 text-[10px]">
              Available in Micro Tier
            </Badge>
          </div>
        )}

        {/* Product Collections Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Featured Retail Collections</h2>
              <p className="text-xs text-slate-400">Order directly with authentic verification</p>
            </div>
            <Badge variant="outline" className="border-rose-400/30 text-rose-400 text-xs">
              {catalogue.length} Items Available
            </Badge>
          </div>

          {catalogue.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center text-xs text-slate-400">
              No retail items or products displayed yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {catalogue.map((item) => {
                const waLink = waOrderUrl(item.title);
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-[#1E293B]/80 overflow-hidden flex flex-col justify-between hover:border-rose-500/40 transition-all hover:shadow-xl group"
                  >
                    <div>
                      {item.imageUrl && (
                        <div className="h-52 w-full overflow-hidden bg-slate-900 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {item.price && (
                            <div className="absolute top-3 right-3 bg-rose-600/90 backdrop-blur-md text-white font-mono font-bold text-xs px-2.5 py-1 rounded-lg shadow-md">
                              {item.currency || '₹'} {item.price}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                          {item.itemType}
                        </div>
                        <h4 className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      {waLink ? (
                        <a href={waLink} target="_blank" rel="noopener noreferrer" className="w-full">
                          <Button
                            size="sm"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 gap-1.5 shadow-md shadow-emerald-600/10"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Order via WhatsApp</span>
                          </Button>
                        </a>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => onOpenExchange(`Order enquiry: ${item.title}`)}
                          className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-9 gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enquire Price</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Physical Store Location & Timing Banner */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-[#1E293B]/70 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-rose-400" />
            Visit Our Showroom & Boutique
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
            <div>
              <span className="text-slate-500 block font-semibold uppercase text-[10px]">Store Address</span>
              <p className="mt-1 font-medium">{profile.address || primaryBusiness?.address || 'Fort Kochi, Kochi, Kerala'}</p>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold uppercase text-[10px]">Showroom Hours</span>
              <p className="mt-1 font-medium">{profile.workingHours || 'Mon – Sun: 10:00 – 21:30 IST'}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full py-8 text-center border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center justify-center gap-2">
            <span>Powered by</span>
            <span className="font-bold text-rose-400">{brandConfig.name}</span>
            <span>&mdash; Retail Marketplace</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
