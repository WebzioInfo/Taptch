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
  Gem,
  Lock,
  Landmark,
  TrendingUp,
} from 'lucide-react';
import type { TemplateLayoutProps } from './types';
import { UpiPaymentCard } from '@/components/profile/UpiPaymentCard';
import type { UpiPaymentConfig } from '@/lib/upi';

export function ApexCapitalTemplate({
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

  // Extract optional UPI config if attached to customFields
  const rawUpi = (profile as unknown as { customFields?: { upiConfig?: UpiPaymentConfig } }).customFields?.upiConfig;
  const upiConfig: UpiPaymentConfig | null = rawUpi?.isEnabled && rawUpi.upiId ? rawUpi : null;

  return (
    <div className="w-full min-h-screen bg-[#021A14] text-[#ECFDF5] flex flex-col items-center">
      {/* Demo Notice */}
      {profile.isDemo && (
        <div className="w-full bg-[#10B981]/15 border-b border-[#10B981]/30 px-4 py-2 text-center text-xs text-[#34D399] font-medium">
          [DEMO PROFILE] Apex Capital &amp; Private Wealth &mdash; Prestige property and venture advisory
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-3xl px-4 sm:px-6 py-8 space-y-8">
        {/* Emerald Prestige Hero Card */}
        <div className="rounded-3xl border border-[#10B981]/30 bg-[#062D24] shadow-2xl overflow-hidden relative">
          <div className="h-44 sm:h-56 w-full relative bg-[#022019]">
            {profile.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.coverUrl}
                alt="Prestige Background"
                className="w-full h-full object-cover brightness-75"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#022C22] via-[#064E3B] to-[#011B14]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#062D24] via-transparent to-black/40" />

            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={onOpenQr}
                className="p-2.5 rounded-xl bg-black/60 border border-[#10B981]/20 text-[#ECFDF5] hover:bg-black/80 transition-colors shadow-lg backdrop-blur-md cursor-pointer"
                title="View VIP QR"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onCopyLink}
                className="p-2.5 rounded-xl bg-black/60 border border-[#10B981]/20 text-[#ECFDF5] hover:bg-black/80 transition-colors shadow-lg backdrop-blur-md cursor-pointer"
                title="Share Card"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            <div className="absolute top-4 left-4">
              <Badge className="bg-[#10B981] text-[#022C22] font-bold tracking-wide uppercase text-[10px] px-3 py-1 shadow-md">
                <Gem className="w-3 h-3 mr-1.5 inline" />
                Apex Capital &amp; Private Equity
              </Badge>
            </div>
          </div>

          <div className="px-6 pb-6 pt-0 relative flex flex-col items-center text-center -mt-16 sm:-mt-20">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl border-4 border-[#062D24] overflow-hidden bg-[#0A382E] flex items-center justify-center font-bold text-3xl shadow-2xl text-[#10B981]">
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

            <div className="mt-4 space-y-1.5 max-w-xl">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {profile.displayName}
                </h1>
                <ShieldCheck className="w-5 h-5 text-[#10B981]" />
              </div>

              {profile.headline && (
                <p className="text-sm sm:text-base text-[#34D399] font-medium tracking-wide">
                  {profile.headline}
                </p>
              )}

              {primaryBusiness?.companyName && (
                <p className="text-xs text-[#A7F3D0] uppercase tracking-wider font-semibold">
                  {primaryBusiness.companyName}
                  {primaryBusiness.roleTitle && ` • ${primaryBusiness.roleTitle}`}
                </p>
              )}

              {profile.location && (
                <p className="text-xs text-neutral-400">{profile.location}</p>
              )}

              {profile.bio && (
                <p className="text-xs sm:text-sm text-[#D1FAE5]/80 pt-2 leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center w-full max-w-md">
              <Button
                onClick={onDownloadVCard}
                className="flex-1 bg-[#10B981] hover:bg-[#059669] text-[#022C22] font-bold text-xs h-11 rounded-xl shadow-lg transition-all"
              >
                <Download className="mr-2 h-4 w-4" />
                Save Private vCard
              </Button>
              <Button
                onClick={() => onOpenExchange()}
                variant="outline"
                className="flex-1 border-[#10B981]/40 text-[#ECFDF5] hover:bg-[#10B981]/10 text-xs h-11 rounded-xl"
              >
                <Send className="mr-2 h-4 w-4" />
                Connect Privately
              </Button>
            </div>
          </div>
        </div>

        {/* Optional UPI Payment Section */}
        {upiConfig && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#A7F3D0] uppercase tracking-wider flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#10B981]" />
              Direct Settlement &amp; Escrow
            </h3>
            <UpiPaymentCard
              config={upiConfig}
              className="bg-[#062D24] border-[#10B981]/30 text-white"
            />
          </div>
        )}

        {/* Associated Ventures / Assets */}
        {businesses.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#A7F3D0] uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-[#10B981]" />
              Off-Market Portfolios &amp; Enterprises
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {businesses.map((biz) => (
                <div
                  key={biz.id}
                  className="rounded-2xl border border-[#10B981]/20 bg-[#062D24]/80 p-5 space-y-2 hover:border-[#10B981]/50 transition-colors shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-white">{biz.companyName}</h4>
                    {biz.websiteUrl && (
                      <a
                        href={biz.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#10B981] hover:text-[#34D399]"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  {biz.roleTitle && (
                    <p className="text-xs text-[#34D399] font-medium">{biz.roleTitle}</p>
                  )}
                  {biz.description && (
                    <p className="text-xs text-neutral-300 leading-relaxed">{biz.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* High-Ticket Assets & Offerings Shelf */}
        {catalogue.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#A7F3D0] uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
                Investment Offerings &amp; Real Estate
              </h3>
              {isNano && (
                <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px]">
                  <Lock className="w-3 h-3 mr-1" />
                  Mini Plan Required for Full Enquiries
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {catalogue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#10B981]/20 bg-[#062D24]/80 overflow-hidden shadow-lg flex flex-col justify-between"
                >
                  {item.imageUrl && (
                    <div className="h-36 w-full relative overflow-hidden bg-neutral-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-white">{item.title}</h4>
                        {item.price && (
                          <span className="text-xs font-mono font-bold text-[#34D399]">
                            {item.price}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-neutral-300 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="pt-3">
                      <Button
                        size="sm"
                        onClick={() => onOpenExchange(`Enquiry regarding: ${item.title}`)}
                        className="w-full text-xs bg-[#10B981] hover:bg-[#059669] text-[#022C22] font-bold h-8"
                      >
                        Request Private Teaser
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 pb-4 text-xs text-neutral-500 space-y-1">
          <p>Verified Private Wealth Identity</p>
          <p className="text-[10px] text-neutral-600">
            Powered by {brandConfig.name} Enterprise Architecture
          </p>
        </div>
      </div>
    </div>
  );
}
