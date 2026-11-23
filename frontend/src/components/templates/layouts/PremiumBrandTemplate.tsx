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
  Tag,
  Lock,
  Phone,
  MessageSquare,
} from 'lucide-react';
import type { TemplateLayoutProps } from './types';
import { UpiPaymentCard } from '@/components/profile/UpiPaymentCard';
import type { UpiPaymentConfig } from '@/lib/upi';
import { DirectContactSection } from '@/components/profile/DirectContactSection';
import { SocialLinksSection } from '@/components/profile/SocialLinksSection';
import { formatTelLink, formatWhatsAppLink } from '@/lib/contact-utils';

import { TemplateContactForm } from '../TemplateContactForm';

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

  const cfg = (profile.themeConfig || {}) as Record<string, string>;
  const primary = cfg.primary || '#D4AF37';
  const secondary = cfg.secondary || '#E5C058';
  const accent = cfg.accent || primary;
  const bg = cfg.background || '#0A0A0C';
  const cardBg = cfg.cardBackground || cfg.surface || '#121216';
  const text = cfg.text || '#EDEDED';
  const heading = cfg.heading || '#FFFFFF';
  const btnBg = cfg.buttonBackground || primary;
  const btnText = cfg.buttonText || '#0A0A0C';
  const border = cfg.border || 'rgba(212, 175, 55, 0.25)';

  return (
    <div className="w-full min-h-screen flex flex-col items-center transition-colors duration-150" style={{ backgroundColor: bg, color: text }}>
      {/* Demo Notice */}
      {profile.isDemo && (
        <div className="w-full px-4 py-2 text-center text-xs font-medium" style={{ backgroundColor: `${primary}22`, borderBottom: `1px solid ${primary}44`, color: primary }}>
          [DEMO PROFILE] Meridian Luxury Estates &mdash; Realistic prestige brand &amp; private wealth sample
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-3xl px-3 sm:px-6 py-4 sm:py-8 space-y-6">
        {/* Obsidian Hero Card */}
        <div className="rounded-3xl shadow-2xl overflow-hidden relative" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
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
              <Badge className="font-bold tracking-wide uppercase text-[10px] px-3 py-1 shadow-md" style={{ backgroundColor: primary, color: btnText }}>
                <Crown className="w-3 h-3 mr-1.5 inline" />
                Obsidian Luxury &amp; Private Reserve
              </Badge>
            </div>
          </div>

          <div className="px-6 pb-6 pt-0 relative flex flex-col items-center text-center -mt-16 sm:-mt-20">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl border-4 overflow-hidden flex items-center justify-center font-bold text-3xl shadow-2xl" style={{ borderColor: cardBg, backgroundColor: bg, color: primary }}>
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

              <div className="mt-4 space-y-1 w-full min-w-0 max-w-sm px-2">
                <div className="flex items-center justify-center gap-1.5">
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight break-words" style={{ color: heading }}>
                      {profile.displayName}
                    </h1>
                    <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: primary }} />
                </div>
                {profile.headline && (
                    <p className="text-sm font-medium opacity-90 break-words max-w-sm mx-auto" style={{ color: text }}>
                      {profile.headline}
                    </p>
              )}
                    {primaryBusiness?.companyName && (
                <div className="flex items-center justify-center gap-1.5 text-xs opacity-75 pt-1 break-words" style={{ color: text }}>
                  <Building className="h-3.5 w-3.5 shrink-0" style={{ color: primary }} />
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
                style={{ backgroundColor: btnBg, color: btnText }}
              >
                <Download className="h-4 w-4" />
                <span>Save this profile</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenExchange('Private Concierge & Portfolio Inquiry')}
                className="gap-2 font-semibold text-xs h-10 border"
                style={{ borderColor: border, backgroundColor: 'rgba(255,255,255,0.06)', color: text }}
              >
                <Send className="h-4 w-4" style={{ color: primary }} />
                <span>Exchange Card</span>
              </Button>
            </div>

            {/* Quick Call & WhatsApp Action Buttons */}
                    {(profile.phone || profile.whatsapp) && (
                      <div className="flex items-center gap-2.5 w-full max-w-sm mt-3">
                        {profile.phone && formatTelLink(profile.phone) && (
                          <a href={formatTelLink(profile.phone)!} className="flex-1">
                            <Button
                              variant="outline"
                              className="w-full text-xs h-9 gap-1.5 border"
                              style={{ borderColor: border, backgroundColor: 'rgba(255,255,255,0.04)', color: text }}
                            >
                              <Phone className="w-3.5 h-3.5" style={{ color: primary }} />
                              <span>Call</span>
                            </Button>
                          </a>
                        )}
                        {(profile.whatsapp || profile.phone) && formatWhatsAppLink(profile.whatsapp, profile.phone) && (
                          <a
                            href={formatWhatsAppLink(profile.whatsapp, profile.phone)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              className="w-full text-xs h-9 gap-1.5 border text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </Button>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
        </div>

              {/* Direct Contact Coordinates Section */}
              <DirectContactSection
                phone={profile.phone}
                whatsapp={profile.whatsapp}
                email={profile.email}
                website={profile.website}
                address={profile.address}
                variant="obsidian"
                themeStyle={{
                  accentColor: primary,
                  cardBg,
                  borderColor: border,
                  textColor: text,
                  headingColor: heading,
                }}
              />

              {/* Social Networking Channels */}
              <SocialLinksSection
                socialLinks={profile.socialLinks}
                variant="obsidian"
                themeStyle={{
                  accentColor: primary,
                  cardBg,
                  borderColor: border,
                  textColor: text,
                  headingColor: heading,
                }}
              />

              {/* Direct UPI Payment Section */}
              {upiConfig && (
                <UpiPaymentCard
                  config={upiConfig}
                  className="text-white"
                  style={{ backgroundColor: cardBg, borderColor: border }}
                />
              )}

              {/* Private Bio / Brand Philosophy */}
              {profile.bio && (
                <div className="p-6 rounded-2xl space-y-2" style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}>
                  <h3 className="text-xs uppercase tracking-wider font-bold" style={{ color: primary }}>
                    Brand Philosophy &amp; Private Portfolio
                  </h3>
                  <p className="text-xs leading-relaxed whitespace-pre-line opacity-90" style={{ color: text }}>
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Plan Lock Banner */}
              {isNano && (
                <div className="p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ backgroundColor: `${primary}15`, border: `1px solid ${border}`, color: text }}>
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 shrink-0" style={{ color: primary }} />
                    <div>
                      <span className="font-bold">Max Plan Exclusive:</span> High-resolution private asset portfolio and concierge lead exchange are unlocked on Max.
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]" style={{ borderColor: border, color: primary }}>
                    Available in Max Tier
                  </Badge>
                </div>
              )}

              {/* Exclusive Showcase */}
              {catalogue.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: border }}>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight flex items-center gap-2" style={{ color: heading }}>
                        <Tag className="w-4 h-4" style={{ color: primary }} />
                        Curated Private Assets &amp; Services
                      </h2>
                      <p className="text-xs opacity-75" style={{ color: text }}>Exclusive acquisitions &amp; bespoke mandates</p>
                    </div>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: border, color: primary }}>
                      {catalogue.length} Private Listings
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {catalogue.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg transition-colors"
                        style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
                      >
                        <div className="space-y-3">
                          {item.imageUrl && (
                            <div className="h-48 w-full rounded-xl overflow-hidden bg-neutral-900 border" style={{ borderColor: border }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center justify-between text-[11px] uppercase font-bold" style={{ color: primary }}>
                              <span>{item.itemType}</span>
                              {item.price && (
                                <span className="font-mono text-sm font-bold" style={{ color: heading }}>
                                  {item.currency || '₹'} {item.price}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm mt-1 leading-snug" style={{ color: heading }}>{item.title}</h4>
                            {item.description && (
                              <p className="text-xs opacity-75 mt-2 leading-relaxed line-clamp-3" style={{ color: text }}>
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t flex items-center gap-2" style={{ borderColor: `${border}55` }}>
                          <Button
                            size="sm"
                            variant="gold"
                            onClick={() => onOpenExchange(`Private enquiry for: ${item.title}`)}
                            className="w-full text-xs h-9 gap-1.5 font-bold"
                            style={{ backgroundColor: btnBg, color: btnText }}
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Request Mandate</span>
                          </Button>
                          {item.actionUrl && (
                            <a href={item.actionUrl} target="_blank" rel="noopener noreferrer">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border text-xs h-9 px-3"
                                style={{ borderColor: border, backgroundColor: 'rgba(255,255,255,0.05)', color: text }}
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

              {/* Native Luxury Concierge & Contact Form */}
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
                  <span className="font-bold" style={{ color: primary }}>{brandConfig.name}</span>
                  <span>&mdash; Obsidian Luxury Edition</span>
                </div>
              </footer>
            </div>
          </div>
          );
}

