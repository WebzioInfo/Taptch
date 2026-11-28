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
  Phone,
  MessageSquare,
} from 'lucide-react';
import type { TemplateLayoutProps } from './types';
import { UpiPaymentCard } from '@/components/profile/UpiPaymentCard';
import type { UpiPaymentConfig } from '@/lib/upi';
import { DirectContactSection } from '@/components/profile/DirectContactSection';
import { SocialLinksSection } from '@/components/profile/SocialLinksSection';
import { formatTelLink, formatWhatsAppLink } from '@/lib/contact-utils';
import { WhatsAppIcon } from '@/lib/social-icons';

import { TemplateContactForm } from '../TemplateContactForm';

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

  const rawUpi = (profile as unknown as { customFields?: { upiConfig?: UpiPaymentConfig } }).customFields?.upiConfig;
  const upiConfig: UpiPaymentConfig | null = rawUpi?.isEnabled && rawUpi.upiId ? rawUpi : null;

  const cfg = (profile.themeConfig || {}) as Record<string, string>;
  const primary = cfg.primary || '#2563EB';
  const secondary = cfg.secondary || '#3B82F6';
  const accent = cfg.accent || primary;
  const bg = cfg.background || '#0B0F19';
  const cardBg = cfg.cardBackground || cfg.surface || '#111827';
  const text = cfg.text || '#F1F5F9';
  const heading = cfg.heading || '#FFFFFF';
  const btnBg = cfg.buttonBackground || primary;
  const btnText = cfg.buttonText || '#FFFFFF';
  const border = cfg.border || 'rgba(37, 99, 235, 0.25)';

  return (
    <div className="w-full min-h-screen flex flex-col items-center transition-colors duration-150" style={{ backgroundColor: bg, color: text }}>
      {/* Demo Notice */}
      {profile.isDemo && (
        <div className="w-full px-4 py-2 text-center text-xs font-medium" style={{ backgroundColor: `${primary}22`, borderBottom: `1px solid ${primary}44`, color: primary }}>
          [DEMO PROFILE] Singhania Corporate Advisory &mdash; Realistic B2B enterprise &amp; holding group sample
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-4xl px-3 sm:px-6 py-4 sm:py-8 space-y-6">
        {/* Executive Hero Card */}
        <div className="rounded-3xl shadow-2xl overflow-hidden relative" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
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

            <div className="px-5 pb-6 pt-0 relative flex flex-col items-center text-center -mt-14 sm:-mt-16">
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

                    <div className="w-full min-w-0 mt-4 space-y-1.5 px-2">
                      <div className="flex items-center justify-center gap-2">
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white break-words">
                          {profile.displayName}
                        </h1>
                        <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0" />
                      </div>
                      {profile.headline && (
                          <p className="text-sm font-medium text-slate-300 leading-snug break-words max-w-sm mx-auto">
                            {profile.headline}
                          </p>
                        )}
                          {primaryBusiness?.companyName && (
                          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 pt-1">
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

                      <div className="w-full max-w-sm mt-5 space-y-2.5">
                        <div className="grid grid-cols-2 gap-2.5 w-full">
                          <Button
                            onClick={onDownloadVCard}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-2 text-xs h-10 px-3 shadow-lg shadow-blue-600/20"
                          >
                            <Download className="h-4 w-4 shrink-0" />
                            <span className="truncate">Save Card</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => onOpenExchange('Institutional / B2B Corporate Enquiry')}
                            className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs h-10 px-3 gap-2"
                          >
                            <Send className="h-4 w-4 text-blue-400 shrink-0" />
                            <span className="truncate">B2B Enquiry</span>
                          </Button>
                        </div>
                        {(profile.phone || profile.whatsapp) && (
                          <div className="grid grid-cols-2 gap-2.5 w-full">
                            {profile.phone && formatTelLink(profile.phone) && (
                              <a href={formatTelLink(profile.phone)!} className="w-full">
                                <Button
                                  variant="outline"
                                  className="w-full border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs h-9 px-3 gap-1.5"
                                >
                                  <Phone className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                  <span>Call</span>
                                </Button>
                              </a>
                            )}
                            {(profile.whatsapp || profile.phone) && formatWhatsAppLink(profile.whatsapp, profile.phone) && (
                              <a
                                href={formatWhatsAppLink(profile.whatsapp, profile.phone)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                              >
                                <Button
                                  variant="outline"
                                  className="w-full border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs h-9 px-3 gap-1.5"
                                >
                                  <WhatsAppIcon className="h-3.5 w-3.5 shrink-0 text-[#25D366]" aria-hidden="true" />
                                  <span>WhatsApp</span>
                                </Button>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Direct Contact Coordinates Section */}
                  <DirectContactSection
                    phone={profile.phone}
                    whatsapp={profile.whatsapp}
                    email={profile.email}
                    website={profile.website}
                    address={profile.address}
                    variant="corporate"
                    themeStyle={{
                      accentColor: '#3B82F6',
                      cardBg: '#111827',
                      borderColor: '#1E293B',
                      textColor: '#F1F5F9',
                      headingColor: '#60A5FA',
                    }}
                  />

                  {/* Social Networking Channels */}
                  <SocialLinksSection
                    socialLinks={profile.socialLinks}
                    variant="corporate"
                    themeStyle={{
                      accentColor: '#3B82F6',
                      cardBg: '#111827',
                      borderColor: '#1E293B',
                      textColor: '#F1F5F9',
                      headingColor: '#60A5FA',
                    }}
                  />

                  {/* Direct UPI Payment Section */}
                  {upiConfig && (
                    <UpiPaymentCard
                      config={upiConfig}
                      className="bg-[#111827] border-blue-500/30 text-white"
                    />
                  )}

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

                  {/* Native Corporate Contact & RFP Section */}
                  <TemplateContactForm
                    profileId={profile.id}
                    profileName={profile.displayName}
                    isBusiness={profile.profileType === 'business'}
                    themeStyle={{
                      accentColor: primary,
                      cardBg,
                      borderColor: border,
                      textColor: text,
                      buttonColor: btnBg,
                      buttonTextColor: btnText,
                      inputBg: bg,
                    }}
                  />

                  {/* Footer */}
                    <footer className="w-full py-8 text-center border-t text-xs opacity-70" style={{ borderColor: border }}>
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
