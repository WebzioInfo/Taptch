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
  MapPin,
  Briefcase,
  Lock,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import type { TemplateLayoutProps } from './types';

export function ModernBusinessTemplate({
  profile,
  onDownloadVCard,
  onOpenExchange,
  onOpenQr,
  onCopyLink,
  previewPlanId,
}: TemplateLayoutProps) {
  const [activeTab, setActiveTab] = React.useState<'all' | 'products' | 'services'>('all');
  const businesses = profile.businesses || [];
  const catalogue = profile.catalogue || [];
  const primaryBusiness = businesses[0];
  const isNano = previewPlanId === 'nano';

  const filteredCatalogue = catalogue.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'products') return item.itemType === 'product';
    if (activeTab === 'services') return item.itemType === 'service';
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-[#022c22] text-slate-100 flex flex-col items-center">
      {/* Demo Notice */}
      {profile.isDemo && (
        <div className="w-full bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 text-center text-xs text-emerald-300 font-medium">
          [DEMO PROFILE] NexaCore Cloud Systems &mdash; Realistic modern business &amp; SaaS commercial sample
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-4xl px-4 sm:px-6 py-8 space-y-8">
        {/* Modern Emerald Hero Card */}
        <div className="rounded-3xl border border-emerald-500/25 bg-[#064e3b]/90 shadow-2xl overflow-hidden relative">
          <div className="h-44 sm:h-56 w-full relative bg-emerald-950">
            {profile.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.coverUrl}
                alt="Modern Tech Cover"
                className="w-full h-full object-cover brightness-80"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-emerald-900/60 via-teal-900/40 to-slate-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#064e3b] via-transparent to-black/30" />

            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={onOpenQr}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white hover:bg-slate-800 transition-colors shadow-lg"
                title="View QR Code"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onCopyLink}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white hover:bg-slate-800 transition-colors shadow-lg"
                title="Share Profile Link"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            <div className="absolute top-4 left-4">
              <Badge className="bg-emerald-500 text-slate-950 font-bold tracking-wide uppercase text-[10px] px-3 py-1 shadow-md">
                <Briefcase className="w-3 h-3 mr-1.5 inline" />
                Modern Business &amp; Technology
              </Badge>
            </div>
          </div>

          <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left -mt-14 sm:-mt-16">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border-4 border-[#064e3b] overflow-hidden bg-emerald-950 flex items-center justify-center font-bold text-3xl shadow-2xl shrink-0">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-emerald-400">{profile.displayName.charAt(0)}</span>
              )}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  {profile.displayName}
                </h1>
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              </div>
              {profile.headline && (
                <p className="text-sm font-medium text-emerald-100 leading-snug">
                  {profile.headline}
                </p>
              )}
              {primaryBusiness?.companyName && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-emerald-200/80 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-emerald-400" />
                    {primaryBusiness.companyName}
                  </span>
                  {primaryBusiness.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                      {primaryBusiness.address}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0 mt-4 md:mt-0">
              <Button
                onClick={onDownloadVCard}
                className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold gap-2 text-xs h-10 px-5 shadow-lg shadow-emerald-500/20"
              >
                <Download className="h-4 w-4" />
                <span>Save this profile</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenExchange('Partnership & Commercial Discussion')}
                className="flex-1 md:flex-none border-emerald-400/30 bg-emerald-950/60 text-emerald-100 hover:bg-emerald-900 text-xs h-10 px-5 gap-2"
              >
                <Send className="h-4 w-4 text-emerald-400" />
                <span>Exchange Card</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Business Highlights */}
        {profile.highlights && profile.highlights.length > 0 && (
          <div className="p-6 rounded-2xl border border-emerald-500/20 bg-[#064e3b]/50 space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Core Competencies &amp; Highlights
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {profile.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan Lock Banner */}
        {isNano && (
          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold">Mini / Max Feature:</span> Product &amp; service showcase with instant quoting is unlocked on Mini &amp; Max plans.
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-400/50 text-emerald-300 shrink-0 text-[10px]">
              Available in Mini Tier
            </Badge>
          </div>
        )}

        {/* Product / Service Dual-Tab Shelf */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Products &amp; Service Catalogue</h2>
              <p className="text-xs text-emerald-200/70">Enterprise solutions and managed deployments</p>
            </div>
            <div className="flex bg-emerald-950/80 p-1 rounded-xl border border-emerald-500/30">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  activeTab === 'all' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-emerald-300 hover:text-white'
                }`}
              >
                All ({catalogue.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  activeTab === 'products' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-emerald-300 hover:text-white'
                }`}
              >
                Products
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('services')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  activeTab === 'services' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-emerald-300 hover:text-white'
                }`}
              >
                Services
              </button>
            </div>
          </div>

          {filteredCatalogue.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-950/40 text-center text-xs text-emerald-300/70">
              No items listed under this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCatalogue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-emerald-500/20 bg-[#064e3b]/80 p-5 flex flex-col justify-between space-y-4 hover:border-emerald-400/40 transition-colors shadow-lg"
                >
                  <div className="space-y-3">
                    {item.imageUrl && (
                      <div className="h-44 w-full rounded-xl overflow-hidden bg-emerald-950 border border-emerald-500/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between text-[11px] uppercase font-bold text-emerald-400">
                        <span>{item.itemType}</span>
                        {item.price && (
                          <span className="font-mono text-sm text-white font-bold">
                            {item.currency || '₹'} {item.price}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white mt-1 leading-snug">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-emerald-200/80 mt-2 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-500/20 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => onOpenExchange(`Enquiry: ${item.title}`)}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-9 gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enquire Now</span>
                    </Button>
                    {item.actionUrl && (
                      <a href={item.actionUrl} target="_blank" rel="noopener noreferrer">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-emerald-500/30 bg-emerald-950/60 text-emerald-100 hover:bg-emerald-900 text-xs h-9 px-3"
                          title="Open Link"
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
        <footer className="w-full py-8 text-center border-t border-emerald-500/20 text-xs text-emerald-300/60">
          <div className="flex items-center justify-center gap-2">
            <span>Powered by</span>
            <span className="font-bold text-emerald-400">{brandConfig.name}</span>
            <span>&mdash; Modern Business Profile</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
