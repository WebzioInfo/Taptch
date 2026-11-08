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
  Send,
  ExternalLink,
  Sparkles,
  Lock,
  Palette,
  Layers,
} from 'lucide-react';
import type { TemplateLayoutProps } from './types';

export function CreativeAgencyTemplate({
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
    <div className="w-full min-h-screen bg-[#0B0D1B] text-slate-100 flex flex-col items-center">
      {/* Demo Notice */}
      {profile.isDemo && (
        <div className="w-full bg-purple-500/15 border-b border-purple-500/30 px-4 py-2 text-center text-xs text-purple-300 font-medium">
          [DEMO PROFILE] Horizon Creative Studios &mdash; Realistic agency &amp; digital creator sample
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-4xl px-4 sm:px-6 py-8 space-y-8">
        {/* Glassmorphic Creative Hero */}
        <div className="rounded-3xl border border-purple-500/20 bg-[#151833]/80 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          <div className="h-44 sm:h-56 w-full relative bg-purple-950">
            {profile.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.coverUrl}
                alt="Creative Showcase"
                className="w-full h-full object-cover brightness-75"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-cyan-950/60" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#151833] via-transparent to-black/30" />

            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={onOpenQr}
                className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-white hover:bg-black/70 transition-colors shadow-lg backdrop-blur-md"
                title="View Creator QR"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onCopyLink}
                className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-white hover:bg-black/70 transition-colors shadow-lg backdrop-blur-md"
                title="Share Creator Link"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            <div className="absolute top-4 left-4">
              <Badge className="bg-purple-600 text-white font-bold tracking-wide uppercase text-[10px] px-3 py-1 shadow-md">
                <Palette className="w-3 h-3 mr-1.5 inline" />
                Creative Direction &amp; Digital Studio
              </Badge>
            </div>
          </div>

          <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left -mt-14 sm:-mt-16">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border-4 border-[#151833] overflow-hidden bg-purple-950 flex items-center justify-center font-bold text-3xl shadow-2xl shrink-0 text-purple-400">
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

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {profile.displayName}
                </h1>
                <ShieldCheck className="h-5 w-5 text-purple-400 shrink-0" />
              </div>
              {profile.headline && (
                <p className="text-sm font-medium text-purple-200/90 leading-snug">
                  {profile.headline}
                </p>
              )}
            </div>

            <div className="flex flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0 mt-4 md:mt-0">
              <Button
                onClick={() => onOpenExchange('Project Commission / Brand Collaboration')}
                className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-500 text-white font-bold gap-2 text-xs h-10 px-5 shadow-lg shadow-purple-600/20"
              >
                <Send className="h-4 w-4" />
                <span>Start Project</span>
              </Button>
              <Button
                variant="outline"
                onClick={onDownloadVCard}
                className="flex-1 md:flex-none border-purple-500/30 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50 text-xs h-10 px-5 gap-2"
              >
                <Download className="h-4 w-4 text-purple-400" />
                <span>Save this profile</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Bio / Studio Manifesto */}
        {profile.bio && (
          <div className="p-6 rounded-2xl border border-purple-500/20 bg-[#151833]/60 backdrop-blur-md space-y-2">
            <h3 className="text-xs uppercase tracking-wider font-bold text-purple-400">
              Studio Manifesto
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Plan Lock Banner */}
        {isNano && (
          <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="font-bold">Micro / Mini Feature:</span> High-resolution project portfolio &amp; agency rate card are unlocked on Micro &amp; Mini plans.
              </div>
            </div>
            <Badge variant="outline" className="border-purple-400/50 text-purple-300 shrink-0 text-[10px]">
              Available in Micro Tier
            </Badge>
          </div>
        )}

        {/* Visual Portfolio & Project Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Selected Works &amp; Studio Offerings
              </h2>
              <p className="text-xs text-purple-300/70">Creative direction, brand identity, and design sprints</p>
            </div>
            <Badge variant="outline" className="border-purple-400/30 text-purple-400 text-xs">
              {catalogue.length} Projects
            </Badge>
          </div>

          {catalogue.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-purple-500/20 bg-purple-950/20 text-center text-xs text-purple-300/70">
              No creative projects or portfolio items added yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {catalogue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-purple-500/20 bg-[#151833]/80 overflow-hidden flex flex-col justify-between hover:border-purple-400/50 transition-all hover:shadow-xl group"
                >
                  <div>
                    {item.imageUrl && (
                      <div className="h-52 w-full overflow-hidden bg-purple-950 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {item.price && (
                          <div className="absolute top-3 right-3 bg-purple-600/90 backdrop-blur-md text-white font-mono font-bold text-xs px-2.5 py-1 rounded-lg">
                            {item.currency || '₹'} {item.price}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-5 space-y-2">
                      <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                        {item.itemType}
                      </div>
                      <h4 className="font-bold text-base text-white group-hover:text-purple-300 transition-colors">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => onOpenExchange(`Project Commission: ${item.title}`)}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9 gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Commission Work</span>
                    </Button>
                    {item.actionUrl && (
                      <a href={item.actionUrl} target="_blank" rel="noopener noreferrer">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-purple-500/30 bg-purple-950/40 text-purple-200 hover:bg-purple-900 text-xs h-9 px-3"
                          title="View Case Study"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="w-full py-8 text-center border-t border-purple-500/20 text-xs text-purple-300/60">
          <div className="flex items-center justify-center gap-2">
            <span>Powered by</span>
            <span className="font-bold text-purple-400">{brandConfig.name}</span>
            <span>&mdash; Creative Studios Edition</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

