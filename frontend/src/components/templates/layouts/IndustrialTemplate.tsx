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
  ExternalLink,
  ShieldCheck,
  Send,
  FileText,
  Phone,
  Mail,
  MapPin,
  Clock,
  Wrench,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import type { TemplateLayoutProps } from './types';

import { TemplateContactForm } from '../TemplateContactForm';

export function IndustrialTemplate({
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
    <div className="w-full min-h-screen bg-[#0F172A] text-slate-100 flex flex-col items-center">
      {/* Industrial Demo Notice if active */}
      {profile.isDemo && (
        <div className="w-full bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-300 font-medium">
          [DEMO PROFILE] Apex Industrial Solutions &mdash; Realistic engineering & machinery sample
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-4xl px-4 sm:px-6 py-8 space-y-8">
        {/* Engineering Industrial Hero Header */}
        <div className="rounded-3xl border border-slate-700/80 bg-[#1E293B] shadow-2xl overflow-hidden relative">
          {/* Machinery Shop Floor Cover Banner */}
          <div className="h-44 sm:h-56 w-full relative bg-slate-800">
            {profile.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.coverUrl}
                alt="Plant Facility"
                className="w-full h-full object-cover brightness-75"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-amber-600/30 via-slate-800 to-slate-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] via-transparent to-black/40" />

            {/* Top Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={onOpenQr}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white hover:bg-slate-800 transition-colors shadow-lg"
                title="View Machinery QR"
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

            {/* Industrial Category Ribbon */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-amber-500/90 text-slate-950 font-bold tracking-wide uppercase text-[10px] px-3 py-1">
                <Wrench className="w-3 h-3 mr-1.5 inline" />
                Heavy Machinery & Manufacturing
              </Badge>
            </div>
          </div>

          {/* Plant Identity Details */}
          <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left -mt-14 sm:-mt-16">
            {/* Logo / Crest */}
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border-4 border-[#1E293B] overflow-hidden bg-slate-800 flex items-center justify-center font-bold text-3xl shadow-2xl shrink-0">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-amber-400">{profile.displayName.charAt(0)}</span>
              )}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  {profile.displayName}
                </h1>
                <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0" />
              </div>
              {profile.headline && (
                <p className="text-sm font-medium text-slate-300 leading-snug">
                  {profile.headline}
                </p>
              )}
              {primaryBusiness?.companyName && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-amber-400" />
                    {primaryBusiness.companyName}
                  </span>
                  {primaryBusiness.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-amber-400" />
                      {primaryBusiness.address}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0 mt-4 md:mt-0">
              <Button
                onClick={onDownloadVCard}
                className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold gap-2 text-xs h-10 px-5 shadow-lg shadow-amber-500/20"
              >
                <Download className="h-4 w-4" />
                <span>Save Supplier Card</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenExchange('Request for Quotation (RFQ) / Engineering Specs')}
                className="flex-1 md:flex-none border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs h-10 px-5 gap-2"
              >
                <Send className="h-4 w-4 text-amber-400" />
                <span>Submit RFQ</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Plant Operations & Working Hours Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-slate-800 bg-[#1E293B]/70 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Factory Operations</div>
              <div className="text-xs font-bold text-slate-200">{profile.workingHours || 'Mon – Sat: 08:30 – 18:00 IST'}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-800 bg-[#1E293B]/70 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Technical Desk</div>
              <div className="text-xs font-bold text-slate-200">{profile.phone || '+91 484 290 8800'}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-800 bg-[#1E293B]/70 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Procurement Email</div>
              <div className="text-xs font-bold text-slate-200">{profile.email || 'info@apexindustrial-demo.com'}</div>
            </div>
          </div>
        </div>

        {/* Engineering Highlights / Quality Capabilities */}
        {profile.highlights && profile.highlights.length > 0 && (
          <div className="p-6 rounded-2xl border border-slate-800 bg-[#1E293B]/60 space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-bold text-amber-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Manufacturing & Quality Capabilities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {profile.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan Lock Banner for Nano Tier */}
        {isNano && (
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold">Mini / Max Plan Feature:</span> Full Machinery Catalogue & Technical PDF downloads are unlocked on the Mini plan and above.
              </div>
            </div>
            <Badge variant="outline" className="border-amber-400/50 text-amber-300 shrink-0 text-[10px]">
              Available in Mini Tier
            </Badge>
          </div>
        )}

        {/* Machinery & Equipment Catalogue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Machinery & Systems Catalogue</h2>
              <p className="text-xs text-slate-400">Technical specifications and direct RFQ quotes</p>
            </div>
            <Badge variant="outline" className="border-amber-400/30 text-amber-400 text-xs">
              {catalogue.length} Systems Listed
            </Badge>
          </div>

          {catalogue.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center text-xs text-slate-400">
              No machinery or industrial equipment items registered yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {catalogue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-[#1E293B]/80 p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-colors shadow-lg"
                >
                  <div className="space-y-3">
                    {item.imageUrl && (
                      <div className="h-44 w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between text-[11px] uppercase font-bold text-amber-400">
                        <span>{item.itemType}</span>
                        {item.price && (
                          <span className="font-mono text-sm text-white">
                            {item.currency || '₹'} {item.price}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white mt-1 leading-snug">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => onOpenExchange(`RFQ for: ${item.title}`)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-9 gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Request RFQ</span>
                    </Button>
                    {item.actionUrl && (
                      <a href={item.actionUrl} target="_blank" rel="noopener noreferrer">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs h-9 px-3"
                          title="View Specsheet"
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

        {/* Technical PDF Brochures & Specifications */}
        {profile.brochures && profile.brochures.length > 0 && (
          <div className="p-6 rounded-2xl border border-slate-800 bg-[#1E293B]/60 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Technical Documentation & Machinery Specsheets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.brochures.map((b, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{b.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{b.fileSize || 'PDF Specsheet'}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenExchange(`Download request: ${b.title}`)}
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs shrink-0 h-8 gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subsidiary Plants & Industrial Units */}
        {businesses.length > 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
              Plant Facilities & Specialized Divisions ({businesses.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {businesses.slice(1).map((biz) => (
                <div key={biz.id} className="p-5 rounded-2xl border border-slate-800 bg-[#1E293B]/60 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{biz.companyName}</h4>
                      {biz.roleTitle && <p className="text-xs text-amber-400">{biz.roleTitle}</p>}
                    </div>
                    {biz.industry && (
                      <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">
                        {biz.industry}
                      </Badge>
                    )}
                  </div>
                  {biz.description && <p className="text-xs text-slate-400 leading-relaxed">{biz.description}</p>}
                  {biz.address && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>{biz.address}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Native Industrial RFQ & Procurement Form */}
        <TemplateContactForm
          profileId={profile.id}
          profileName={profile.displayName}
          isBusiness={profile.profileType === 'business'}
          themeStyle={{
            accentColor: '#F59E0B',
            cardBg: '#1E293B',
            borderColor: 'rgba(245, 158, 11, 0.3)',
            textColor: '#F8FAFC',
            buttonColor: '#D97706',
            buttonTextColor: '#0F172A',
            inputBg: '#0F172A',
          }}
        />

        {/* Footer */}
        <footer className="w-full py-8 text-center border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center justify-center gap-2">
            <span>Powered by</span>
            <span className="font-bold text-amber-400">{brandConfig.name}</span>
            <span>&mdash; Industrial Marketing Directory</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
