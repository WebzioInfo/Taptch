'use client';

import * as React from 'react';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Download,
  Share2,
  Globe,
  Building,
  QrCode,
  CheckCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Send,
  AlertCircle,
  Loader2,
  X,
  FileText,
} from 'lucide-react';

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
}

export function ProfileRenderer({ profile }: { profile: ProfileRenderData }) {
  const [activeTab, setActiveTab] = React.useState<'profile' | 'businesses' | 'catalogue'>('profile');
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
  const catalogue = profile.catalogue || [];
  const primaryBusiness = businesses[0];

  // Theme styling based on templateId
  const theme = profile.templateId || 'obsidian-luxury';
  const isIvory = theme === 'ivory-minimal';
  const isAurora = theme === 'aurora-creator';
  const isZenith = theme === 'zenith-corporate';
  const isApex = theme === 'apex-capital';

  const containerBg = isIvory
    ? 'bg-[#F9F7F2] text-[#1E1E24]'
    : isAurora
    ? 'bg-[#0B0D1B] text-slate-100'
    : isZenith
    ? 'bg-[#080D1A] text-slate-100'
    : isApex
    ? 'bg-[#021A15] text-slate-100'
    : 'bg-[#0A0A0C] text-[#EDEDED]'; // Obsidian luxury default

  const cardSurface = isIvory
    ? 'bg-white border-[#E2DDD3] shadow-md text-[#1E1E24]'
    : isAurora
    ? 'bg-[#151833]/80 border-purple-500/20 backdrop-blur-md'
    : isZenith
    ? 'bg-[#0F172A]/80 border-blue-500/20 backdrop-blur-md'
    : isApex
    ? 'bg-[#052E25]/80 border-emerald-500/20 backdrop-blur-md'
    : 'bg-[#121216] border-white/10 backdrop-blur-md';

  const accentColor = isIvory
    ? 'text-[#8C6D3B]'
    : isAurora
    ? 'text-[#A855F7]'
    : isZenith
    ? 'text-[#3B82F6]'
    : isApex
    ? 'text-[#10B981]'
    : 'text-[#D4AF37]'; // Obsidian gold

  const handleDownloadVCard = () => {
    const vCardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${profile.displayName}`,
      profile.headline ? `TITLE:${profile.headline}` : '',
      primaryBusiness?.companyName ? `ORG:${primaryBusiness.companyName}` : '',
      primaryBusiness?.roleTitle ? `ROLE:${primaryBusiness.roleTitle}` : '',
      primaryBusiness?.websiteUrl ? `URL:${primaryBusiness.websiteUrl}` : '',
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
      navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exchangeName.trim()) return;

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

  return (
    <div className={`min-h-screen ${containerBg} flex flex-col items-center justify-between transition-colors`}>
      {/* Top Banner & Header */}
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl px-4 py-8 space-y-6">
        {/* Cover / Profile Banner Card */}
        <div className={`rounded-3xl border overflow-hidden ${cardSurface} shadow-2xl relative`}>
          {/* Cover gradient or image */}
          <div className="h-32 sm:h-44 w-full bg-gradient-to-r from-primary/30 via-primary/10 to-primary/20 relative">
            {profile.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.coverUrl}
                alt="Profile Cover"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="p-2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-colors"
                title="View QR Code"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-colors"
                title="Share Profile Link"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Profile Identity Info */}
          <div className="px-6 pb-6 pt-0 relative flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="-mt-16 sm:-mt-20 h-28 w-28 sm:h-32 sm:w-32 rounded-3xl border-4 border-background overflow-hidden bg-primary/20 flex items-center justify-center font-bold text-3xl sm:text-4xl shadow-xl">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className={accentColor}>{profile.displayName.charAt(0)}</span>
              )}
            </div>

            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {profile.displayName}
                </h1>
                <ShieldCheck className={`h-5 w-5 ${accentColor}`} />
              </div>
              {profile.headline && (
                <p className="text-sm font-medium opacity-80 max-w-md">
                  {profile.headline}
                </p>
              )}
              {primaryBusiness?.companyName && (
                <div className="flex items-center justify-center gap-1.5 text-xs opacity-70 pt-1">
                  <Building className="h-3.5 w-3.5" />
                  <span>{primaryBusiness.companyName}</span>
                  {primaryBusiness.roleTitle && <span>• {primaryBusiness.roleTitle}</span>}
                </div>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-6">
              <Button
                variant="gold"
                size="default"
                onClick={handleDownloadVCard}
                className="gap-2 shadow-lg font-semibold"
              >
                <Download className="h-4 w-4" />
                <span>Save Contact</span>
              </Button>

              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  setExchangeSuccess(false);
                  setShowExchangeModal(true);
                }}
                className="gap-2 font-semibold"
              >
                <Send className="h-4 w-4" />
                <span>Exchange</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs (if businesses or catalogue exist) */}
        {(businesses.length > 0 || catalogue.length > 0) && (
          <div className="flex justify-center border-b border-white/10 pb-2 gap-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`pb-2 transition-colors border-b-2 ${
                activeTab === 'profile'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              Overview
            </button>
            {businesses.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('businesses')}
                className={`pb-2 transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'businesses'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <span>Businesses</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {businesses.length}
                </Badge>
              </button>
            )}
            {catalogue.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('catalogue')}
                className={`pb-2 transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'catalogue'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <span>Showcase</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {catalogue.length}
                </Badge>
              </button>
            )}
          </div>
        )}

        {/* Tab 1: Overview / Bio */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {profile.bio && (
              <div className={`p-6 rounded-2xl border ${cardSurface}`}>
                <h3 className="text-xs uppercase tracking-wider font-semibold opacity-60 mb-2">
                  About
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-line opacity-90">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Quick Contact Info */}
            {primaryBusiness?.websiteUrl && (
              <div className={`p-4 rounded-xl border ${cardSurface} flex items-center justify-between text-sm`}>
                <div className="flex items-center gap-3">
                  <Globe className={`h-4 w-4 ${accentColor}`} />
                  <span>Official Website</span>
                </div>
                <a
                  href={primaryBusiness.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs flex items-center gap-1 font-medium hover:underline ${accentColor}`}
                >
                  Visit <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Multiple Businesses */}
        {activeTab === 'businesses' && (
          <div className="space-y-4">
            {businesses.map((biz) => (
              <div key={biz.id} className={`p-6 rounded-2xl border ${cardSurface} space-y-3`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{biz.companyName}</h3>
                    {biz.roleTitle && (
                      <p className={`text-xs font-medium ${accentColor}`}>{biz.roleTitle}</p>
                    )}
                  </div>
                  {biz.industry && (
                    <Badge variant="outline" className="text-[10px]">
                      {biz.industry}
                    </Badge>
                  )}
                </div>

                {biz.description && (
                  <p className="text-xs opacity-80 leading-relaxed">{biz.description}</p>
                )}

                <div className="flex items-center gap-4 pt-2 border-t border-white/10 text-xs">
                  {biz.websiteUrl && (
                    <a
                      href={biz.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 hover:underline ${accentColor}`}
                    >
                      <Globe className="h-3 w-3" /> Website
                    </a>
                  )}
                  {biz.brochureUrl && (
                    <a
                      href={biz.brochureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 opacity-70 hover:opacity-100"
                    >
                      <FileText className="h-3 w-3" /> Brochure
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Catalogue (Products & Services) */}
        {activeTab === 'catalogue' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {catalogue.map((item) => (
              <div key={item.id} className={`p-5 rounded-2xl border ${cardSurface} flex flex-col justify-between space-y-3`}>
                <div>
                  <div className="flex items-center justify-between text-[10px] uppercase font-semibold tracking-wider opacity-60">
                    <span>{item.itemType}</span>
                    {item.price && (
                      <span className={`font-mono text-sm font-bold ${accentColor}`}>
                        {item.currency || '₹'} {item.price}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-base mt-1">{item.title}</h4>
                  {item.description && (
                    <p className="text-xs opacity-80 mt-1 leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  )}
                </div>

                {item.actionUrl ? (
                  <a href={item.actionUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                      <span>View Details</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setExchangeNotes(`Enquiry regarding: ${item.title}`);
                      setShowExchangeModal(true);
                    }}
                    className="w-full text-xs gap-1.5"
                  >
                    <span>Enquire Now</span>
                    <Send className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <footer className="w-full py-8 text-center border-t border-white/5 opacity-60 hover:opacity-100 transition-opacity">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-medium tracking-tight"
        >
          <span>Powered by</span>
          <span className={`font-bold ${accentColor}`}>{brandConfig.name}</span>
        </a>
      </footer>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-3xl border p-6 space-y-4 ${cardSurface} relative`}>
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg">Scan to Connect</h3>
              <p className="text-xs opacity-70">
                Point your camera or QR reader to open this digital card.
              </p>
            </div>
            {/* SVG QR Code representation */}
            <div className="bg-white p-6 rounded-2xl flex items-center justify-center shadow-inner">
              <div className="h-44 w-44 rounded-xl border-4 border-black flex items-center justify-center relative p-2">
                <QrCode className="h-full w-full text-black" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                    {brandConfig.name.charAt(0)}
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="w-full text-xs gap-1.5"
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
          <div className={`w-full max-w-md rounded-3xl border p-6 space-y-4 ${cardSurface} relative my-8`}>
            <button
              type="button"
              onClick={() => setShowExchangeModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg">Exchange Contact</h3>
              <p className="text-xs opacity-70">
                Share your card with {profile.displayName} for mutual networking.
              </p>
            </div>

            {exchangeSuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-base">Contact Card Shared!</h4>
                <p className="text-xs opacity-70">
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
                  <Label className="text-[11px] opacity-70">Full Name *</Label>
                  <Input
                    value={exchangeName}
                    onChange={(e) => setExchangeName(e.target.value)}
                    required
                    placeholder="e.g. Vikramaditya Rao"
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] opacity-70">Email Address</Label>
                    <Input
                      type="email"
                      value={exchangeEmail}
                      onChange={(e) => setExchangeEmail(e.target.value)}
                      placeholder="vikram@apex.in"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] opacity-70">Phone Number</Label>
                    <Input
                      type="tel"
                      value={exchangePhone}
                      onChange={(e) => setExchangePhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] opacity-70">Company / Organization</Label>
                    <Input
                      value={exchangeCompany}
                      onChange={(e) => setExchangeCompany(e.target.value)}
                      placeholder="Apex Capital"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] opacity-70">Job Title</Label>
                    <Input
                      value={exchangeJobTitle}
                      onChange={(e) => setExchangeJobTitle(e.target.value)}
                      placeholder="Managing Director"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] opacity-70">Note / Reason to Connect</Label>
                  <Input
                    value={exchangeNotes}
                    onChange={(e) => setExchangeNotes(e.target.value)}
                    placeholder="Met at summit / discussion regarding partnership"
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="gold"
                    disabled={exchangeLoading}
                    className="w-full text-xs gap-1.5"
                  >
                    {exchangeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    <span>Send My Contact</span>
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
