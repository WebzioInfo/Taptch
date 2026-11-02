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
  FileText,
  MapPin,
  Briefcase,
  Lock,
  Globe,
  Layers,
} from 'lucide-react';
import type { TemplateLayoutProps } from './types';

export function CorporateBusinessTemplate({
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

  return (
    <div className="w-full min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col items-center">
      {/* Demo Notice */}
      {profile.isDemo && (
        <div className="w-full bg-blue-500/15 border-b border-blue-500/30 px-4 py-2 text-center text-xs text-blue-300 font-medium">
          [DEMO PROFILE] Singhania Corporate Advisory &mdash; Realistic B2B enterprise &amp; holding group sample
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-4xl px-4 sm:px-6 py-8 space-y-8">
        {/* Executive Hero Card */}
        <div className="rounded-3xl border border-blue-500/20 bg-[#111827] shadow-2xl overflow-hidden relative">
          <div className="h-44 sm:h-56 w-full relative bg-slate-900">
            {profile.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.coverUrl}
                alt="Corporate Tower"
                className="w-full h-full object-cover brightness-75"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-black/40" />

            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={onOpenQr}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white hover:bg-slate-800 transition-colors shadow-lg"
                title="View Corporate QR"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onCopyLink}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white hover:bg-slate-800 transition-colors shadow-lg"
                title="Share Corporate Card"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            <div className="absolute top-4 left-4">
              <Badge className="bg-blue-600 text-white font-bold tracking-wide uppercase text-[10px] px-3 py-1 shadow-md">
                <Briefcase className="w-3 h-3 mr-1.5 inline" />
                Enterprise Advisory &amp; Holding Group
              </Badge>
            </div>
          </div>

          <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left -mt-14 sm:-mt-16">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border-4 border-[#111827] overflow-hidden bg-slate-800 flex items-center justify-center font-bold text-3xl shadow-2xl shrink-0">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-blue-400">{profile.displayName.charAt(0)}</span>
              )}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {profile.displayName}
                </h1>
                <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0" />
              </div>
              {profile.headline && (
                <p className="text-sm font-medium text-slate-300 leading-snug">
                  {profile.headline}
                </p>
              )}
              {primaryBusiness?.companyName && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-blue-400" />
                    {primaryBusiness.companyName}
                  </span>
                  {primaryBusiness.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-400" />
                      {primaryBusiness.address}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0 mt-4 md:mt-0">
              <Button
                onClick={onDownloadVCard}
                className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold gap-2 text-xs h-10 px-5 shadow-lg shadow-blue-600/20"
              >
                <Download className="h-4 w-4" />
                <span>Save Executive Card</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenExchange('Institutional / B2B Corporate Enquiry')}
                className="flex-1 md:flex-none border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs h-10 px-5 gap-2"
              >
                <Send className="h-4 w-4 text-blue-400" />
                <span>B2B Enquiry</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Corporate Bio */}
        {profile.bio && (
          <div className="p-6 rounded-2xl border border-slate-800 bg-[#111827]/70 space-y-2">
            <h3 className="text-xs uppercase tracking-wider font-bold text-blue-400">
              Executive Overview
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Plan Lock Banner */}
        {isNano && (
          <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="font-bold">Mini / Max Feature:</span> Multi-subsidiary switcher and advisory practice areas are unlocked on Mini &amp; Max plans.
              </div>
            </div>
            <Badge variant="outline" className="border-blue-400/50 text-blue-300 shrink-0 text-[10px]">
              Available in Mini Tier
            </Badge>
          </div>
        )}

        {/* Subsidiaries & Operating Ventures Switcher */}
        {businesses.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Subsidiaries &amp; Practice Groups
                </h2>
                <p className="text-xs text-slate-400">Operating corporate entities &amp; specialized arms</p>
              </div>
              <Badge variant="outline" className="border-blue-400/30 text-blue-400 text-xs">
                {businesses.length} Group Entities
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {businesses.map((biz) => (
                <div
                  key={biz.id}
                  className="rounded-2xl border border-slate-800 bg-[#111827]/80 p-5 space-y-3 hover:border-blue-500/40 transition-colors shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base text-white">{biz.companyName}</h4>
                      {biz.roleTitle && <p className="text-xs text-blue-400 font-medium">{biz.roleTitle}</p>}
                    </div>
                    {biz.industry && (
                      <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
                        {biz.industry}
                      </Badge>
                    )}
                  </div>
                  {biz.description && (
                    <p className="text-xs text-slate-400 leading-relaxed">{biz.description}</p>
                  )}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-4 text-xs">
                    {biz.websiteUrl && (
                      <a
                        href={biz.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-blue-400 hover:underline"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Website</span>
                      </a>
                    )}
                    {biz.brochureUrl && (
                      <a
                        href={biz.brochureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-slate-300 hover:text-white"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Briefing</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Corporate Advisory Services / Offerings */}
        {catalogue.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
              Institutional Capabilities &amp; Advisory Retainers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {catalogue.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-slate-800 bg-[#111827]/70 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-blue-400">
                      <span>{item.itemType}</span>
                      {item.price && (
                        <span className="font-mono text-sm text-white">
                          {item.currency || '₹'} {item.price}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-white mt-1">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onOpenExchange(`Corporate advisory enquiry: ${item.title}`)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-9 gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Engage Advisory</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="w-full py-8 text-center border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center justify-center gap-2">
            <span>Powered by</span>
            <span className="font-bold text-blue-400">{brandConfig.name}</span>
            <span>&mdash; Corporate Enterprise Directory</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
