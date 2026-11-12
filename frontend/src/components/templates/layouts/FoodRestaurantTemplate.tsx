'use client';

import * as React from 'react';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Share2,
  QrCode,
  ShieldCheck,
  Phone,
  MapPin,
  Clock,
  UtensilsCrossed,
  Lock,
  CalendarCheck,
} from 'lucide-react';
import type { TemplateLayoutProps } from './types';

import { TemplateContactForm } from '../TemplateContactForm';

export function FoodRestaurantTemplate({
  profile,
  onDownloadVCard,
  onOpenExchange,
  onOpenQr,
  onCopyLink,
  previewPlanId,
}: TemplateLayoutProps) {
  const catalogue = profile.catalogue || [];
  const isNano = previewPlanId === 'nano';

  return (
    <div className="w-full min-h-screen bg-[#18181B] text-zinc-100 flex flex-col items-center">
      {/* Demo Notice */}
      {profile.isDemo && (
        <div className="w-full bg-orange-500/15 border-b border-orange-500/30 px-4 py-2 text-center text-xs text-orange-300 font-medium">
          [DEMO PROFILE] Saffron &amp; Spice Bistro &mdash; Realistic culinary &amp; restaurant sample
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-4xl px-4 sm:px-6 py-8 space-y-8">
        {/* Restaurant Header */}
        <div className="rounded-3xl border border-orange-500/20 bg-[#27272A] shadow-2xl overflow-hidden relative">
          <div className="h-44 sm:h-56 w-full relative bg-zinc-800">
            {profile.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.coverUrl}
                alt="Culinary Ambiance"
                className="w-full h-full object-cover brightness-80"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-orange-900/40 via-red-900/30 to-zinc-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#27272A] via-transparent to-black/40" />

            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={onOpenQr}
                className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-700 text-white hover:bg-zinc-800 transition-colors shadow-lg"
                title="View Restaurant QR"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onCopyLink}
                className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-700 text-white hover:bg-zinc-800 transition-colors shadow-lg"
                title="Share Menu Link"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            <div className="absolute top-4 left-4">
              <Badge className="bg-orange-600 text-white font-bold tracking-wide uppercase text-[10px] px-3 py-1 shadow-md">
                <UtensilsCrossed className="w-3 h-3 mr-1.5 inline" />
                Artisanal Bistro &amp; Dining
              </Badge>
            </div>
          </div>

          <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left -mt-14 sm:-mt-16">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border-4 border-[#27272A] overflow-hidden bg-zinc-800 flex items-center justify-center font-bold text-3xl shadow-2xl shrink-0">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-orange-400">{profile.displayName.charAt(0)}</span>
              )}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  {profile.displayName}
                </h1>
                <ShieldCheck className="h-5 w-5 text-orange-400 shrink-0" />
              </div>
              {profile.headline && (
                <p className="text-sm font-medium text-zinc-300 leading-snug">
                  {profile.headline}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-zinc-400 pt-1">
                {profile.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-orange-400" />
                    {profile.location}
                  </span>
                )}
                {profile.workingHours && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-orange-400" />
                    {profile.workingHours}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0 mt-4 md:mt-0">
              <Button
                onClick={() => onOpenExchange('Table Reservation Request')}
                className="flex-1 md:flex-none bg-orange-600 hover:bg-orange-500 text-white font-bold gap-2 text-xs h-10 px-5 shadow-lg shadow-orange-600/20"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>Reserve Table</span>
              </Button>
              <Button
                variant="outline"
                onClick={onDownloadVCard}
                className="flex-1 md:flex-none border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs h-10 px-5 gap-2"
              >
                <Download className="h-4 w-4 text-orange-400" />
                <span>Save this profile</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Dining Hours & Reservation Notice */}
        <div className="p-4 rounded-2xl border border-zinc-800 bg-[#27272A]/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">Kitchen Hours: </span>
              <span className="text-zinc-300">{profile.workingHours || 'Lunch: 12:00 – 15:30 | Dinner: 19:00 – 23:00 IST'}</span>
            </div>
          </div>
          {profile.phone && (
            <a href={`tel:${profile.phone}`} className="flex items-center gap-1.5 text-orange-400 font-semibold hover:underline">
              <Phone className="w-3.5 h-3.5" />
              <span>Direct Reservations: {profile.phone}</span>
            </a>
          )}
        </div>

        {/* Plan Lock Banner */}
        {isNano && (
          <div className="p-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 text-orange-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <span className="font-bold">Micro / Mini Plan Feature:</span> Menu items, prices, and direct table reservation requests are unlocked on Micro & Mini plans.
              </div>
            </div>
            <Badge variant="outline" className="border-orange-400/50 text-orange-300 shrink-0 text-[10px]">
              Available in Micro Tier
            </Badge>
          </div>
        )}

        {/* Chef Specials & Culinary Menu */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Chef&apos;s Signature Menu</h2>
              <p className="text-xs text-zinc-400">Handcrafted seasonal selections &amp; artisanal pairings</p>
            </div>
            <Badge variant="outline" className="border-orange-400/30 text-orange-400 text-xs">
              {catalogue.length} Culinary Items
            </Badge>
          </div>

          {catalogue.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 text-center text-xs text-zinc-400">
              No menu items or chef specials listed yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {catalogue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-zinc-800 bg-[#27272A]/80 p-5 flex flex-col justify-between space-y-4 hover:border-orange-500/40 transition-colors shadow-lg"
                >
                  <div className="space-y-3">
                    {item.imageUrl && (
                      <div className="h-44 w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between text-[11px] uppercase font-bold text-orange-400">
                        <span>{item.itemType}</span>
                        {item.price && (
                          <span className="font-mono text-sm text-white font-bold">
                            {item.currency || '₹'} {item.price}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white mt-1 leading-snug">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-zinc-400 mt-2 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80">
                    <Button
                      size="sm"
                      onClick={() => onOpenExchange(`Order / Reserve: ${item.title}`)}
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs h-9 gap-1.5"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      <span>Order This Item</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Native Table Reservation & Catering Form */}
        <TemplateContactForm
          profileId={profile.id}
          profileName={profile.displayName}
          isBusiness={profile.profileType === 'business'}
          themeStyle={{
            accentColor: '#F97316',
            cardBg: '#27272A',
            borderColor: 'rgba(249, 115, 22, 0.3)',
            textColor: '#F4F4F5',
            buttonColor: '#EA580C',
            buttonTextColor: '#FFFFFF',
            inputBg: '#18181B',
          }}
        />

        {/* Footer */}
        <footer className="w-full py-8 text-center border-t border-zinc-800 text-xs text-zinc-500">
          <div className="flex items-center justify-center gap-2">
            <span>Powered by</span>
            <span className="font-bold text-orange-400">{brandConfig.name}</span>
            <span>&mdash; Hospitality &amp; Dining Directory</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
