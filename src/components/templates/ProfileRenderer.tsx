'use client';

import * as React from 'react';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  QrCode,
  CheckCircle,
  Copy,
  Send,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { IndustrialTemplate } from './layouts/IndustrialTemplate';
import { RetailTemplate } from './layouts/RetailTemplate';
import { FoodRestaurantTemplate } from './layouts/FoodRestaurantTemplate';
import { CorporateBusinessTemplate } from './layouts/CorporateBusinessTemplate';
import { ModernBusinessTemplate } from './layouts/ModernBusinessTemplate';
import { PremiumBrandTemplate } from './layouts/PremiumBrandTemplate';
import { ProfessionalServicesTemplate } from './layouts/ProfessionalServicesTemplate';
import { CreativeAgencyTemplate } from './layouts/CreativeAgencyTemplate';

export interface BusinessItem {
  id: string;
  companyName: string;
  tagline?: string | null;
  roleTitle?: string | null;
  industry?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
  brochureUrl?: string | null;
  address?: string | null;
}

export interface CatalogueItem {
  id: string;
  title: string;
  itemType: 'product' | 'service';
  description?: string | null;
  price?: string | null;
  currency?: string | null;
  imageUrl?: string | null;
  actionUrl?: string | null;
}

export interface ProfileRenderData {
  id: string;
  slug: string;
  displayName: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  profileType?: string | null;
  templateId?: string | null;
  publishedJson?: Record<string, unknown> | null;
  businesses?: BusinessItem[];
  catalogue?: CatalogueItem[];
  // Extended fields for marketing & previews
  category?: string;
  categoryLabel?: string;
  industry?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  address?: string;
  location?: string;
  workingHours?: string;
  highlights?: string[];
  socialLinks?: Array<{ platform: string; url: string }>;
  gallery?: Array<{ url: string; caption?: string }>;
  brochures?: Array<{ title: string; fileUrl: string; fileSize?: string }>;
  isDemo?: boolean;
  previewPlanId?: string;
}

export function ProfileRenderer({ profile }: { profile: ProfileRenderData }) {
  const [showQrModal, setShowQrModal] = React.useState(false);
  const [showExchangeModal, setShowExchangeModal] = React.useState(false);
  const [copiedUrl, setCopiedUrl] = React.useState(false);

  // Exchange contact form state
  const [exchangeName, setExchangeName] = React.useState('');
  const [exchangeEmail, setExchangeEmail] = React.useState('');
  const [exchangePhone, setExchangePhone] = React.useState('');
  const [exchangeCompany, setExchangeCompany] = React.useState('');
  const [exchangeJobTitle, setExchangeJobTitle] = React.useState('');
  const [exchangeNotes, setExchangeNotes] = React.useState('');
  const [exchangeLoading, setExchangeLoading] = React.useState(false);
  const [exchangeSuccess, setExchangeSuccess] = React.useState(false);
  const [exchangeError, setExchangeError] = React.useState<string | null>(null);

  const businesses = profile.businesses || [];
  const primaryBusiness = businesses[0];

  const handleDownloadVCard = () => {
    const vCardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${profile.displayName}`,
      profile.headline ? `TITLE:${profile.headline}` : '',
      primaryBusiness?.companyName ? `ORG:${primaryBusiness.companyName}` : '',
      primaryBusiness?.roleTitle ? `ROLE:${primaryBusiness.roleTitle}` : '',
      profile.phone ? `TEL;TYPE=CELL:${profile.phone}` : '',
      profile.email ? `EMAIL:${profile.email}` : '',
      profile.website || primaryBusiness?.websiteUrl ? `URL:${profile.website || primaryBusiness?.websiteUrl}` : '',
      profile.bio ? `NOTE:${profile.bio.replace(/\n/g, '\\n')}` : '',
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\r\n');

    const blob = new Blob([vCardLines], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${profile.slug}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/p/${profile.slug}`;
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const handleOpenExchange = (initialNote?: string) => {
    if (initialNote) {
      setExchangeNotes(initialNote);
    }
    setExchangeSuccess(false);
    setExchangeError(null);
    setShowExchangeModal(true);
  };

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exchangeName.trim()) return;

    // If demo profile, simulate instant success without making a network request
    if (profile.isDemo) {
      setExchangeLoading(true);
      setTimeout(() => {
        setExchangeLoading(false);
        setExchangeSuccess(true);
      }, 500);
      return;
    }

    setExchangeLoading(true);
    setExchangeError(null);

    try {
      const res = await fetch(`/api/v1/profiles/${profile.id}/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: exchangeName.trim(),
          email: exchangeEmail.trim() || undefined,
          phone: exchangePhone.trim() || undefined,
          company: exchangeCompany.trim() || undefined,
          jobTitle: exchangeJobTitle.trim() || undefined,
          notes: exchangeNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to exchange contact card.');

      setExchangeSuccess(true);
    } catch (err: unknown) {
      setExchangeError(err instanceof Error ? err.message : 'Error sending contact.');
    } finally {
      setExchangeLoading(false);
    }
  };

  // Dispatch to the specialized layout
  const templateId = (profile.templateId || 'obsidian-luxury').toLowerCase();

  const layoutProps = {
    profile,
    onDownloadVCard: handleDownloadVCard,
    onOpenExchange: handleOpenExchange,
    onOpenQr: () => setShowQrModal(true),
    copiedUrl,
    onCopyLink: handleCopyLink,
    previewPlanId: profile.previewPlanId,
  };

  const renderLayout = () => {
    switch (templateId) {
      case 'industrial-manufacturing':
        return <IndustrialTemplate {...layoutProps} />;
      case 'retail-shopping':
        return <RetailTemplate {...layoutProps} />;
      case 'food-restaurant':
        return <FoodRestaurantTemplate {...layoutProps} />;
      case 'corporate-business':
      case 'zenith-corporate':
        return <CorporateBusinessTemplate {...layoutProps} />;
      case 'modern-business':
      case 'catalyst-business':
        return <ModernBusinessTemplate {...layoutProps} />;
      case 'professional-services':
      case 'ivory-minimal':
        return <ProfessionalServicesTemplate {...layoutProps} />;
      case 'creative-agency':
      case 'aurora-creator':
        return <CreativeAgencyTemplate {...layoutProps} />;
      case 'premium-brand':
      case 'obsidian-luxury':
      case 'apex-capital':
      default:
        return <PremiumBrandTemplate {...layoutProps} />;
    }
  };

  return (
    <div className="w-full relative">
      {renderLayout()}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#121216] p-6 space-y-4 text-white relative shadow-2xl">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg">Scan to Connect</h3>
              <p className="text-xs text-neutral-400">
                Point your camera or QR reader to open this digital profile.
              </p>
            </div>
            {/* High Contrast QR Frame */}
            <div className="bg-white p-6 rounded-2xl flex items-center justify-center shadow-inner">
              <div className="h-44 w-44 rounded-xl border-4 border-black flex items-center justify-center relative p-2">
                <QrCode className="h-full w-full text-black" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-9 w-9 rounded-lg bg-black border border-black/40 shadow-md flex items-center justify-center p-1">
                    <BrandLogo variant="symbol" size="sm" className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="w-full text-xs gap-1.5 border-white/20 hover:bg-white/10"
            >
              {copiedUrl ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedUrl ? 'Copied URL!' : 'Copy Profile Link'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Reciprocal Exchange Modal */}
      {showExchangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121216] p-6 space-y-4 text-white relative my-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowExchangeModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg">Direct Enquiry &amp; Contact</h3>
              <p className="text-xs text-neutral-400">
                Share your details with {profile.displayName}.
              </p>
            </div>

            {exchangeSuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-base">Enquiry Sent Successfully!</h4>
                <p className="text-xs text-neutral-400">
                  {profile.displayName} has received your information.
                </p>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => setShowExchangeModal(false)}
                  className="mt-4"
                >
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleExchangeSubmit} className="space-y-3 text-xs">
                {exchangeError && (
                  <div className="p-2.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{exchangeError}</span>
                  </div>
                )}

                <div>
                  <Label className="text-[11px] text-neutral-400">Full Name *</Label>
                  <Input
                    value={exchangeName}
                    onChange={(e) => setExchangeName(e.target.value)}
                    required
                    placeholder="e.g. Vikramaditya Rao"
                    className="h-9 text-xs mt-1 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus-visible:border-amber-400 caret-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-neutral-400">Email Address</Label>
                    <Input
                      type="email"
                      value={exchangeEmail}
                      onChange={(e) => setExchangeEmail(e.target.value)}
                      placeholder="vikram@example.com"
                      className="h-9 text-xs mt-1 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus-visible:border-amber-400 caret-amber-400"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-neutral-400">Phone / WhatsApp</Label>
                    <Input
                      type="tel"
                      value={exchangePhone}
                      onChange={(e) => setExchangePhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-9 text-xs mt-1 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus-visible:border-amber-400 caret-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-neutral-400">Company / Organization</Label>
                    <Input
                      value={exchangeCompany}
                      onChange={(e) => setExchangeCompany(e.target.value)}
                      placeholder="Apex Group"
                      className="h-9 text-xs mt-1 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus-visible:border-amber-400 caret-amber-400"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-neutral-400">Job Title / Designation</Label>
                    <Input
                      value={exchangeJobTitle}
                      onChange={(e) => setExchangeJobTitle(e.target.value)}
                      placeholder="Managing Director"
                      className="h-9 text-xs mt-1 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus-visible:border-amber-400 caret-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] text-neutral-400">Message / Request</Label>
                  <Input
                    value={exchangeNotes}
                    onChange={(e) => setExchangeNotes(e.target.value)}
                    placeholder="Requirement details or inquiry..."
                    className="h-9 text-xs mt-1 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus-visible:border-amber-400 caret-amber-400"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="gold"
                    disabled={exchangeLoading}
                    className="w-full text-xs gap-1.5 h-10 font-bold"
                  >
                    {exchangeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    <span>Submit Enquiry</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
