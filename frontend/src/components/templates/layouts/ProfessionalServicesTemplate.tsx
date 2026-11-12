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
  Clock,
  Lock,
  Scale,
} from 'lucide-react';
import type { TemplateLayoutProps } from './types';
import { UpiPaymentCard } from '@/components/profile/UpiPaymentCard';
import type { UpiPaymentConfig } from '@/lib/upi';

import { TemplateContactForm } from '../TemplateContactForm';

export function ProfessionalServicesTemplate({
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
    <div className="w-full min-h-screen bg-[#FAF8F5] text-[#1E1E24] flex flex-col items-center">
      {/* Demo Notice */}
      {profile.isDemo && (
        <div className="w-full bg-[#8C6D3B]/10 border-b border-[#8C6D3B]/20 px-4 py-2 text-center text-xs text-[#8C6D3B] font-serif font-medium">
          [DEMO PROFILE] Veritas Legal &amp; Partners &mdash; Realistic professional services &amp; legal practice sample
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-3xl px-4 sm:px-6 py-8 space-y-8 font-serif">
        {/* Editorial Paper Hero Card */}
        <div className="rounded-3xl border border-[#E2DDD3] bg-white shadow-xl overflow-hidden relative font-sans">
          <div className="h-40 sm:h-52 w-full relative bg-[#EFECE6]">
            {profile.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.coverUrl}
                alt="Chambers Background"
                className="w-full h-full object-cover brightness-95"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#DCD7CD] via-[#E8E4DA] to-[#EDE9E1]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />

            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={onOpenQr}
                className="p-2.5 rounded-xl bg-white/80 border border-[#E2DDD3] text-[#1E1E24] hover:bg-white transition-colors shadow-md backdrop-blur-sm"
                title="View Chambers QR"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onCopyLink}
                className="p-2.5 rounded-xl bg-white/80 border border-[#E2DDD3] text-[#1E1E24] hover:bg-white transition-colors shadow-md backdrop-blur-sm"
                title="Share Profile Link"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            <div className="absolute top-4 left-4">
              <Badge className="bg-[#8C6D3B] text-white font-serif tracking-wide uppercase text-[10px] px-3 py-1 shadow-sm">
                <Scale className="w-3 h-3 mr-1.5 inline" />
                Legal Chambers &amp; Advisory Practice
              </Badge>
            </div>
          </div>

          <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left -mt-14 sm:-mt-16">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border-4 border-white overflow-hidden bg-[#FAF8F5] flex items-center justify-center font-bold text-3xl shadow-xl shrink-0 text-[#8C6D3B]">
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
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E1E24] font-serif">
                  {profile.displayName}
                </h1>
                <ShieldCheck className="h-5 w-5 text-[#8C6D3B] shrink-0" />
              </div>
              {profile.headline && (
                <p className="text-sm text-[#4A4A52] leading-snug font-serif">
                  {profile.headline}
                </p>
              )}
              {primaryBusiness?.companyName && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-[#71717A] pt-1">
                  <span className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-[#8C6D3B]" />
                    {primaryBusiness.companyName}
                  </span>
                  {primaryBusiness.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#8C6D3B]" />
                      {primaryBusiness.address}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0 mt-4 md:mt-0 font-sans">
              <Button
                onClick={onDownloadVCard}
                className="flex-1 md:flex-none bg-[#8C6D3B] hover:bg-[#73572D] text-white font-medium gap-2 text-xs h-10 px-5 shadow-md"
              >
                <Download className="h-4 w-4" />
                <span>Save Counsel Card</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenExchange('Confidential Consultation Request')}
                className="flex-1 md:flex-none border-[#E2DDD3] bg-[#FAF8F5] text-[#1E1E24] hover:bg-[#F0EDE6] text-xs h-10 px-5 gap-2"
              >
                <Send className="h-4 w-4 text-[#8C6D3B]" />
                <span>Book Consultation</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Direct UPI Payment Section */}
        {upiConfig && (
          <UpiPaymentCard
            config={upiConfig}
            className="bg-white border-[#E2DDD3] text-[#1E1E24] shadow-md font-sans"
          />
        )}

        {/* Chambers Hours & Appointment Info */}
        <div className="p-4 rounded-2xl border border-[#E2DDD3] bg-white flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-[#4A4A52]">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-[#8C6D3B] shrink-0" />
            <div>
              <span className="font-semibold text-[#1E1E24]">Consultation Hours: </span>
              <span>{profile.workingHours || 'Mon – Fri: 09:30 – 18:30 IST (By Prior Appointment)'}</span>
            </div>
          </div>
          {profile.location && (
            <div className="flex items-center gap-1 text-[#8C6D3B] font-medium">
              <MapPin className="w-3.5 h-3.5" />
              <span>{profile.location}</span>
            </div>
          )}
        </div>

        {/* Biography / Chambers Overview */}
        {profile.bio && (
          <div className="p-6 rounded-2xl border border-[#E2DDD3] bg-white space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#8C6D3B] font-sans">
              About the Practice &amp; Counsel
            </h3>
            <p className="text-sm text-[#2D2D34] leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Plan Lock Banner */}
        {isNano && (
          <div className="p-4 rounded-2xl border border-[#8C6D3B]/30 bg-[#8C6D3B]/10 text-[#4A381E] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-[#8C6D3B] shrink-0" />
              <div>
                <span className="font-bold">Mini / Max Feature:</span> Detailed practice areas and counsel retainer listings are unlocked on Mini &amp; Max plans.
              </div>
            </div>
            <Badge variant="outline" className="border-[#8C6D3B]/50 text-[#8C6D3B] shrink-0 text-[10px]">
              Available in Mini Tier
            </Badge>
          </div>
        )}

        {/* Practice Areas / Specializations */}
        {catalogue.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
              <div>
                <h2 className="text-lg font-bold text-[#1E1E24] tracking-tight">Practice Areas &amp; Advisory Services</h2>
                <p className="text-xs text-[#71717A] font-sans">Retainers, dispute counsel, and corporate structuring</p>
              </div>
              <Badge variant="outline" className="border-[#8C6D3B]/30 text-[#8C6D3B] text-xs font-sans">
                {catalogue.length} Practice Areas
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {catalogue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#E2DDD3] bg-white p-5 space-y-3 hover:border-[#8C6D3B]/60 transition-colors shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#8C6D3B] font-sans">
                      <span>{item.itemType}</span>
                      {item.price && (
                        <span className="font-mono text-sm text-[#1E1E24] font-bold">
                          {item.currency || '₹'} {item.price}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-base text-[#1E1E24] mt-1">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs text-[#4A4A52] mt-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="pt-2 font-sans">
                    <Button
                      size="sm"
                      onClick={() => onOpenExchange(`Practice enquiry: ${item.title}`)}
                      className="w-full bg-[#8C6D3B] hover:bg-[#73572D] text-white text-xs h-9 gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Retain Counsel</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Native Editorial Consultation & Retainer Form */}
        <TemplateContactForm
          profileId={profile.id}
          profileName={profile.displayName}
          isBusiness={profile.profileType === 'business'}
          themeStyle={{
            accentColor: '#8C6D3B',
            cardBg: '#FFFFFF',
            borderColor: '#E2DDD3',
            textColor: '#1E1E24',
            buttonColor: '#8C6D3B',
            buttonTextColor: '#FFFFFF',
            inputBg: '#FAF8F5',
          }}
        />

        {/* Footer */}
        <footer className="w-full py-8 text-center border-t border-[#E2DDD3] text-xs text-[#71717A] font-sans">
          <div className="flex items-center justify-center gap-2">
            <span>Powered by</span>
            <span className="font-bold text-[#8C6D3B]">{brandConfig.name}</span>
            <span>&mdash; Professional Services Edition</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
